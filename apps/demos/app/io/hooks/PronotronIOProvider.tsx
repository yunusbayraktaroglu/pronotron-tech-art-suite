"use client";

import { createContext, useEffect, useState, useContext, useMemo } from 'react';
import { usePathname } from 'next/navigation'
import { PronotronIOVerticalObserver } from "@pronotron/io";
import { ResizeObserver as Polyfill } from '@juggle/resize-observer';
import throttle from "lodash.throttle";

import { stats } from "@/app/components/PerformanceStats";
import { usePerformanceStats } from "@/app/hooks/usePerformanceStats";

interface PronotronIOContextType {
	io: PronotronIOVerticalObserver;
};

type vp = {
	height: number;
	offsetTop: number;
	scale: number;
};

const PronotronIOContext = createContext<PronotronIOContextType>( null ! );

export function usePronotronIOContext<T>( selector: ( context: PronotronIOContextType ) => T ): T 
{
	const context = useContext( PronotronIOContext );

	if ( ! context ){
		throw new Error( "useContextSelector must be used within a <PronotronIOProvider>" );
	}

	return selector( context );
};

/**
 * PROVIDER
 * 
 * Using a provider helps the initialization of the IO controller in a top component,
 * calculating viewport props at the end after registering all nodes to IO controller
 */
export function PronotronIOProvider({ children }: { children: React.ReactNode })
{
	const pathname = usePathname();
	const { setIsActive } = usePerformanceStats();

	const pronotronIO = useMemo(() => new PronotronIOVerticalObserver(), []);
	
	const getViewport = () => {
		if ( window.visualViewport ){
			return {
				height: window.visualViewport.height,
				offsetTop: window.visualViewport.offsetTop,
				scale: window.visualViewport.scale,
			};
		}
		return {
			height: window.innerHeight,
			offsetTop: 0,
			scale: 1,
		};
	};

	const updateLayout = ( vp: vp ) => {
		pronotronIO.updateViewportLayout( vp.offsetTop, vp.offsetTop + vp.height );
	};

	useEffect(() => {
		/**
		 * - If a page directly accessed, it runs before general setup
		 * - run handleScroll() for jumpy page starts
		 * 
		 * <Provider> (General Setup, set viewport, scroll/resize events)
		 *    <Page> (Reset tracking events, set scroll 0)
		 *    <Page> (Reset tracking events, set scroll 0)
		 * </Provider>
		 * 
		 * @important
		 * Using Next.js set scroll to false on <Link> components
		 * 
		 * @important
		 * React renders components child to parent
		 */
		window.scrollTo({ top: 0 });
		const vp = getViewport();
		updateLayout( vp );
		pronotronIO.setLastScroll( 0 );
		pronotronIO.handleScroll( window.scrollY );

	}, [ pathname ]);

	useEffect(() => {

		/**
		 * Needs table loop:
		 * - Scroll event
		 * - ResizeObserver event (changes layout)
		 * - VisibleViewport mobile event (dont changes layout)
		 * - Zoom mobile event
		 */

		// Activate performance stats
		setIsActive( true );

		let needsTick = false;
		let animationFrameId = 0;

		let { height: lastHeight, scale: lastZoom } = getViewport();

		const scrollTicker = () => {
			needsTick = true;
		};
		const scroll = () => {
			pronotronIO.handleScroll( window.scrollY );
			needsTick = false;
		};
		const layoutResize = () => {
			const vp = getViewport();
			updateLayout( vp );
			// Resizing updates layout. Needs recalculate node bounds
			pronotronIO.updatePositions( document.documentElement.scrollHeight );
			// Request a scroll handle
			scrollTicker();
		};
		const visualViewportResize = ( vp: vp ) => {
			// VisualViewport changes doesnt affects layout
			updateLayout( vp );
			// Request a scroll handle
			scrollTicker();
		};

		const onScroll = throttle( scroll, 250, { leading: false, trailing: true } );
		const onResize = throttle( layoutResize, 500, { leading: false, trailing: true } );

		/**
		 * Challenges:
		 * 
		 * - Mobile Zoom: When user zoomed-in(pinch) with mobile browser, just changing "visualViewport.offset" property. 
		 * Browser stops triggering scroll for a portion of area. Scroll event should manually triggered each frame.
		 * 
		 * - Mobile topbar shrink/expand behaviour: Browser stops triggering scroll while shrinking/expanding topbar. 
		 * Just changing "visualViewport.height" property. Scroll event should manually triggered each frame.
		 */
		const tick = () => {

			const vp = getViewport();

			// if ( lastZoom !== vp.scale ){
			// 	/**
			// 	 * Just update the viewport 1 time
			// 	 */
			// 	lastZoom = vp.scale;
			// 	visualViewportResize( vp );
			// }
			// if ( lastZoom !== 1 ){
			// 	/**
			// 	 * With the mobile zoom not 1.0, scroll events not triggered while user moving the screen.
			// 	 * Manually trigger scroll event
			// 	 */
			// 	scrollTicker()
			// }
			if ( lastHeight !== vp.height ){
				/**
				 * May mobile statusbar shrink/expand
				 */
				lastHeight = vp.height;
				visualViewportResize( vp );
			}
			stats.begin();
			if ( needsTick ){
				scroll();
			}
			stats.end();

			animationFrameId = requestAnimationFrame( tick );
		};

		animationFrameId = requestAnimationFrame( tick );

		window.addEventListener( 'scroll', scrollTicker, { passive: true } );

		/**
		 * (x) window.addEventListener( 'resize', onResize );
		 * 
		 * - Do not use window.resize event, it's firing every scroll in mobile devices because of topbar behavior.
		 * - Use ResizeObserverPolyfill from '@juggle/resize-observer' to support old devices.
		 * 
		 * This is not running when mobile topbar shrink/expand
		 */
		const ResizeObserver = window.ResizeObserver || Polyfill;
		const ro = new ResizeObserver(() => {
			onResize();
		});
		ro.observe( document.body ); // Watch dimension changes on body

		//console.log( pronotronIO );

		return () => {
			window.removeEventListener( 'scroll', scrollTicker );
			cancelAnimationFrame( animationFrameId );
			stats.resetPanels();
			ro.disconnect();
		}
		
	}, []);

	return (
		<PronotronIOContext.Provider value={{
			io: pronotronIO
		}}>
			{ children }
		</PronotronIOContext.Provider>
	);
}