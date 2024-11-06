"use client";

import { createContext, useEffect, useState, useContext } from 'react';
import { usePathname } from 'next/navigation'
import throttle from "lodash.throttle";

import { PronotronIOVertical } from "@pronotron/io";

export const pronotronIO = new PronotronIOVertical( 55 );

/**
 * CONTEXT
 */
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
 * 
 */
export function PronotronIOProvider({ children }: { children: React.ReactNode })
{
	const pathname = usePathname();
	const [ scrollDirection, setScrollDirection ] = useState<"down" | "up">( "down" );

	useEffect(() => {
		console.log( "path changed" );
		/**
		 * - If a page directly accessed, it runs before general setup
		 * - run handleScroll() for jumpy page starts
		 * 
		 * <Layout> (General Setup, set viewport, scroll events)
		 *    <Page> (Reset tracking events, set scroll 0)
		 *    <Page> (Reset tracking events, set scroll 0)
		 * </Layout>
		 */
		if ( pronotronIO._viewport ){
			pronotronIO.reset();
			pronotronIO.handleScroll( window.scrollY );
		}
	}, [ pathname ]);

	useEffect(() => {
		console.log( "initialization" );

		pronotronIO.setViewport({
			screenHeight: window.innerHeight,
			totalPageHeight: document.documentElement.scrollHeight
		});
		
		const scroll = () => {
			pronotronIO.handleScroll( window.scrollY )
			setScrollDirection( pronotronIO.direction );
		};
		const resize = () => {
			pronotronIO.setViewport({
				screenHeight: window.innerHeight,
				totalPageHeight: document.documentElement.scrollHeight
			});
			pronotronIO.setLastScrollY( 0 );
			pronotronIO.handleScroll( window.scrollY );
			setScrollDirection( pronotronIO.direction );
		};

		// Execute manual scroll for jumpy start scrollY values
		scroll();

		const onScroll = throttle( scroll, 250, { leading: false, trailing: true } );
		const onResize = throttle( resize, 500, { leading: false, trailing: true } );

		window.addEventListener( 'scroll', scroll );

		/**
		 * (x) window.addEventListener( 'resize', onResize );
		 * 
		 * - Do not use window.resize event, it's firing every scroll in mobile devices because of topbar behavior.
		 * - Use ResizeObserverPolyfill from '@juggle/resize-observer' to support old devices.
		 */
		const ResizeObserver = window.ResizeObserver;
		const ro = new ResizeObserver(( entries, observer ) => {
			onResize();
		});
		ro.observe( document.body ); // Watch dimension changes on body

		console.log( pronotronIO );

		return () => {
			window.removeEventListener( 'scroll', scroll );
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
