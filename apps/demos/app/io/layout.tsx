"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import throttle from "lodash.throttle";

import { PronotronIOController, PronotronIODispatcher } from "@pronotron/io";

export default function Layout({ children }: Readonly<{ children: React.ReactNode }> )
{
	const [ scrollDirection, setScrollDirection ] = useState<"down" | "up">( "down" );

	useEffect(() => {
		//console.log( scrollDirection );
	}, [ scrollDirection ])

	useEffect(() => {

		const IO = PronotronIOController.getInstance();

		IO.setViewport({
			screenHeight: window.innerHeight,
			totalPageHeight: document.documentElement.scrollHeight
		});
		
		const scroll = () => {
			IO.handleScroll( window.scrollY )
			setScrollDirection( IO.direction );
		};
		const resize = () => {
			IO.setViewport({
				screenHeight: window.innerHeight,
				totalPageHeight: document.documentElement.scrollHeight
			});
			IO.handleScroll( window.scrollY );
			setScrollDirection( IO.direction );
		};

		// Execute manual scroll for jumpy start scrollY values
		scroll();

		const onScroll = throttle( scroll, 250, { leading: false, trailing: true } );
		const onResize = throttle( resize, 500, { leading: false, trailing: true } );

		window.addEventListener( 'scroll', onScroll );
		window.addEventListener( 'resize', onResize );

		//console.log( IO );

		return () => {
			window.removeEventListener( 'scroll', onScroll );
			window.removeEventListener( 'resize', onResize );
		}
		
	}, []);

	return (
		<div className="flex flex-col p-8 bg-slate-200">
			<h1>IO Testing page</h1>
			<p>Red lines will not be unmount while navigation</p>
			<nav className="flex flex-row items-center py-4 mb-10 sticky top-0 z-50 space-x-1">
				<Link href="/io" className="py-2 px-4 leading-none bg-slate-300 hover:bg-slate-400 rounded-full transition-colors">Page 1</Link>
				<Link href="/io/page-2" className="py-2 px-4 leading-none bg-slate-300 hover:bg-slate-400 rounded-full transition-colors">Page 2</Link>
				<Link href="/io/page-3" className="py-2 px-4 leading-none bg-slate-300 hover:bg-slate-400 rounded-full transition-colors">Page 3</Link>
			</nav>
			<div className="flex flex-row items-center relative h-[80vh]">
				<div>
					<p>Static line</p>
					<PronotronIODispatcher 
						className="absolute block min-h-[2px] w-full touch-none pointer-events-none select-none bg-red-500"
						dispatch={{
							"top-in": () => console.log( "top-in static" ),
							"top-out": () => console.log( "top-out static" )
						}} 
					/>
				</div>
			</div>
			{ children }
		</div>
	);
}
