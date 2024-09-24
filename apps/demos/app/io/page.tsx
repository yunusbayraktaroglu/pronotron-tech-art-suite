"use client";

import { useEffect, useRef, useState } from "react";
import { IOHolder, ViewportTrackerDataOriented } from "@pronotron/io";

export default function Home()
{
	const isMounted = useRef( false );
	const [ bg, setBg ] = useState( "bg-slate-400" );

	useEffect(() => {

		if ( ! isMounted.current ){
			isMounted.current = true;
			return;
		}
		
		const ioManager = new ViewportTrackerDataOriented();

		return () => {
			ioManager.destroy();
		};
	}, []);

	return (
		<div className={ bg }>

			<h1>IO Testing Page</h1>
			<div className="flex h-[90vh] ">
				<IOHolder
					pronotron={{
						"top-in": {
							//retry: 2,
							payload: () => console.log( "top-in" )
						},
						"top-out": {
							//retry: 2,
							payload: () => console.log( "top-out" )
						},
					}} 
					className='absolute block min-h-[2px] w-full touch-none pointer-events-none select-none bg-red-500' 
				/>
			</div>
			<div className="flex h-[50vh]" />
			<div className="flex h-[20vh]">
				<IOHolder 
					pronotron={{
						"bottom-in": {
							//retry: 1,
							payload: () => console.log( "bottom-in" )
						},
						"bottom-out": {
							//retry: 4,
							payload: () => console.log( "bottom-out" )
						}
					}} 
					className='absolute block min-h-[2px] w-full touch-none pointer-events-none select-none bg-red-500' 
				/>
			</div>
			<div className="flex h-[70vh]" />
			<div className="flex h-[20vh]">
				<IOHolder 
					pronotron={{
						"bottom-in": {
							//retry: 1,
							payload: () => console.log( "bottom-in" )
						},
						"bottom-out": {
							//retry: 4,
							payload: () => console.log( "bottom-out" )
						}
					}} 
					className='absolute block min-h-[2px] w-full touch-none pointer-events-none select-none bg-red-500' 
				/>
			</div>
			<div className="flex h-[70vh]" />
			<div className="flex h-[20vh]">
				<IOHolder 
					pronotron={{
						"bottom-in": {
							//retry: 1,
							payload: () => console.log( "bottom-in" )
						},
						"bottom-out": {
							//retry: 4,
							payload: () => console.log( "bottom-out" )
						}
					}} 
					className='absolute block min-h-[2px] w-full touch-none pointer-events-none select-none bg-red-500' 
				/>
			</div>
			<div className="flex h-[70vh]" />
		</div>
	);
}
