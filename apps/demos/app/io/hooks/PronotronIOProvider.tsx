"use client";

import { createContext, useEffect, useState, useContext, useMemo } from 'react';
import { usePathname } from 'next/navigation'
import { PronotronIOVertical } from "@pronotron/io";
import { ResizeObserver as Polyfill } from '@juggle/resize-observer';
import throttle from "lodash.throttle";

import { stats } from "@/app/components/PerformanceStats";

interface PronotronIOContextType {
	io: PronotronIOVertical;
	scrollDirection: "up" | "down";
}

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
	const pronotronIO = useMemo(() => new PronotronIOVertical(), [])
	const pathname = usePathname();
	const [ scrollDirection, setScrollDirection ] = useState<"down" | "up">( "down" );

	useEffect(() => {
		/**
		 * - If a page directly accessed, it runs before general setup
		 * - run handleScroll() for jumpy page starts
		 * 
		 * <Layout> (General Setup, set viewport, scroll events)
		 *    <Page> (Reset tracking events, set scroll 0)
		 *    <Page> (Reset tracking events, set scroll 0)
		 * </Layout>
		 * 
		 * @important
		 * Using Next.js set scroll to false on <Link> components
		 */
		window.scrollTo({ top: 0 });
		pronotronIO.setViewport( window.innerHeight, document.documentElement.scrollHeight );
		pronotronIO.setLastScrollY( 0 );
		pronotronIO.handleScroll( window.scrollY );
		setScrollDirection( pronotronIO.direction );

	}, [ pathname ]);

	useEffect(() => {

		let needsTick = false;
		let animationFrameId = 0;

		const scrollTicker = () => {
			needsTick = true;
		};
		const scroll = () => {
			pronotronIO.handleScroll( window.scrollY )
			setScrollDirection( pronotronIO.direction );
			needsTick = false;
		};
		const resize = () => {
			pronotronIO.setViewport( window.innerHeight, document.documentElement.scrollHeight );
			pronotronIO.setLastScrollY( 0 );
			pronotronIO.handleScroll( window.scrollY );
			setScrollDirection( pronotronIO.direction );
		};

		const onScroll = throttle( scroll, 250, { leading: false, trailing: true } );
		const onResize = throttle( resize, 500, { leading: false, trailing: true } );

		const tick = () => {
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
			io: pronotronIO,
			scrollDirection: scrollDirection
		}}>
			{ children }
		</PronotronIOContext.Provider>
	);
}