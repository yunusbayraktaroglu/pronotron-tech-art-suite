"use client";

import { IODispatcher } from "./hooks/IODispatcher";

export default function Home()
{
	return (
		<div>
			<div className="flex h-[90vh] relative">
				<p>Dynamic line (top-in, top-out)</p>
				<IODispatcher
					className="absolute block min-h-[3px] w-full touch-none pointer-events-none select-none bg-green-500"
					dispatch={{
						"top-in": () => console.log( "GREEN: top-in" ),
						"top-out": () => console.log( "GREEN: top-out" ),
					}} 
				/>
			</div>
			<div className="flex h-[50vh]" />
			<div className="flex h-[20vh] relative">
				<p>Dynamic line - (bottom-in Retry: 1)</p>
				<IODispatcher 
					className="absolute block min-h-[3px] w-full touch-none pointer-events-none select-none bg-orange-500"
					dispatch={{
						retry: 1,
						"bottom-in": () => console.log( "ORANGE: bottom-in once" ),
					}} 
				/>
			</div>
			<div className="flex h-[70vh]" />
			<div className="flex h-[20vh] relative translate-y-[200px]">
				<p>Dynamic line - (bottom-in, bottom-out) CSS transformed</p>
				<IODispatcher 
					className="absolute block min-h-[3px] w-full touch-none pointer-events-none select-none bg-blue-500"
					dispatch={{
						"bottom-in": () => console.log( "BLUE: bottom-in - css transform" ),
						"bottom-out": () => console.log( "BLUE: bottom-out - css transform" )
					}} 
				/>
			</div>
			<div className="flex h-[70vh]" />
			<div className="flex h-[20vh] relative">
				<p>Dynamic line - (bottom-in, bottom-out) CSS transformed</p>
				<IODispatcher 
					className="absolute block min-h-[3px] w-full touch-none pointer-events-none select-none bg-purple-500"
					dispatch={{
						"bottom-in": () => console.log( "PURPLE: bottom-in" ),
						"bottom-out": () => console.log( "PURPLE: bottom-out" )
					}} 
				/>
			</div>
			<div className="flex h-[70vh]" />
		</div>
	);
}