"use client";

import { useEffect, useState } from "react";
import { PronotronIODispatcher, PronotronIOController } from "@pronotron/io";

export default function Home()
{
	const [ bg, setBg ] = useState( "bg-red-200" );
	
	useEffect(() => {
		const controller = PronotronIOController.getInstance();
		controller.reset();
		controller.handleScroll( window.scrollY );
	}, []);

	return (
		<div className={ bg }>
			<div className="flex h-[30vh]" />
			<div className="flex h-[90vh] relative">
				<p>Dynamic line</p>
				<PronotronIODispatcher
					className="absolute block min-h-[2px] w-full touch-none pointer-events-none select-none bg-green-500"
					dispatch={{
						"top-out": () => setBg( "bg-green-200" ),
						"top-in": () => setBg( "bg-red-200" ),
					}} 
				/>
			</div>
			<div className="flex h-[150vh]" />
		</div>
	);
}