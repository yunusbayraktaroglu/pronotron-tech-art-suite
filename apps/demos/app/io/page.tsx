"use client";

import { useEffect, useRef, useState } from "react";
import { PronotronIODispatcher, PronotronIOController, throttle } from "@pronotron/io";


export default function Home()
{
	const isMounted = useRef( false );

	const [ bg, setBg ] = useState( "bg-slate-400" );
	const [ scrollDirection, setScrollDirection ] = useState<"down" | "up">( "down" );

	useEffect(() => {
		//console.log( scrollDirection );
	}, [ scrollDirection ])


	useEffect(() => {

		if ( ! isMounted.current ){
			isMounted.current = true;
			return;
		}

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
			IO._lastScrollY = 0;
			IO.setViewport({
				screenHeight: window.innerHeight,
				totalPageHeight: document.documentElement.scrollHeight
			});
			IO.handleScroll( window.scrollY );
			setScrollDirection( IO.direction );
		};

		// Execute manual scroll for jumpy start scrollY values
		scroll();

		const onScroll = throttle( scroll, 0, { leading: false, trailing: true } );
		const onResize = throttle( resize, 500, { leading: false, trailing: true } );

		window.addEventListener( 'scroll', scroll );
		window.addEventListener( 'resize', onResize );

		//console.log( IO );
		
	}, []);


	return (
		<div className={ bg }>

			<h1>IO Testing Page</h1>
			<div className="flex h-[90vh]">
				<PronotronIODispatcher
					className="absolute block min-h-[2px] w-full touch-none pointer-events-none select-none bg-red-500"
					dispatch={{
						"top-in": () => console.log( "top-in 1" ),
						"top-out": () => console.log( "top-out 1" ),
					}} 
				/>
			</div>
			<div className="flex h-[50vh]" />
			<div className="flex h-[20vh]">
				<PronotronIODispatcher 
					className="absolute block min-h-[2px] w-full touch-none pointer-events-none select-none bg-red-500"
					dispatch={{
						retry: 1,
						"bottom-in": () => console.log( "bottom-in 2 once" ),
					}} 
				/>
			</div>
			<div className="flex h-[70vh]" />
			<div className="flex h-[20vh]">
				<PronotronIODispatcher 
					className="absolute block min-h-[2px] w-full touch-none pointer-events-none select-none bg-red-500"
					dispatch={{
						"bottom-in": () => console.log( "bottom-in 3" ),
						"bottom-out": () => console.log( "bottom-out 3" )
					}} 
				/>
			</div>
			<div className="flex h-[70vh]" />
			<div className="flex h-[20vh]">
				<PronotronIODispatcher 
					className="absolute block min-h-[2px] w-full touch-none pointer-events-none select-none bg-red-500"
					dispatch={{
						"bottom-in": () => console.log( "bottom-in 4" ),
						"bottom-out": () => console.log( "bottom-out 4" )
					}} 
				/>
			</div>
			<div className="flex h-[70vh]" />
		</div>
	);
}


