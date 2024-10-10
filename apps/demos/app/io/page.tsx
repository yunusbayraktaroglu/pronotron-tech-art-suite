"use client";

import { useEffect } from "react";
import { PronotronIODispatcher, PronotronIOController, usePronotronIOPageChange } from "@pronotron/io";

export default function Home()
{
	usePronotronIOPageChange();

	// useEffect(() => {
	// 	const controller = PronotronIOController.getInstance();

	// 	/**
	// 	 * If page directly accessed, it runs before general setup
	// 	 * 
	// 	 * Layout (General Setup)
	// 	 *    - Page (Reset)
	// 	 *    - Page (Reset)
	// 	 */
	// 	if ( controller._viewport ){
	// 		controller.reset();
	// 		controller.handleScroll( window.scrollY );
	// 	}
	// }, []);

	return (
		<div>
			<div className="flex h-[90vh] relative">
				<p>Dynamic line</p>
				<PronotronIODispatcher
					className="absolute block min-h-[2px] w-full touch-none pointer-events-none select-none bg-green-500"
					dispatch={{
						"top-in": () => console.log( "top-in 1" ),
						"top-out": () => console.log( "top-out 1" ),
					}} 
				/>
			</div>
			<div className="flex h-[50vh]" />
			<div className="flex h-[20vh] relative">
				<p>Dynamic line - Retry: 1</p>
				<PronotronIODispatcher 
					className="absolute block min-h-[2px] w-full touch-none pointer-events-none select-none bg-green-500"
					dispatch={{
						retry: 1,
						"bottom-in": () => console.log( "bottom-in 2 once" ),
					}} 
				/>
			</div>
			<div className="flex h-[70vh]" />
			<div className="flex h-[20vh] relative translate-y-[200px]">
				<p>Dynamic line - CSS transformed</p>
				<PronotronIODispatcher 
					className="absolute block min-h-[2px] w-full touch-none pointer-events-none select-none bg-green-500"
					dispatch={{
						"bottom-in": () => console.log( "bottom-in 3 - css transform" ),
						"bottom-out": () => console.log( "bottom-out 3 - css transform" )
					}} 
				/>
			</div>
			<div className="flex h-[70vh]" />
			<div className="flex h-[20vh] relative">
				<PronotronIODispatcher 
					className="absolute block min-h-[2px] w-full touch-none pointer-events-none select-none bg-green-500"
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