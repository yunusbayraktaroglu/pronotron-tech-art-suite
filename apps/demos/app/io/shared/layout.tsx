"use client";

import { IODispatcher } from "../hooks/IODispatcher";

export default function Layout({ children }: Readonly<{ children: React.ReactNode }> )
{
	return (
		<>
			<div className="flex flex-col h-[30vh] landscape:h-[20vh] relative">
				<p>Shared line (top-in, top-out)</p>
				<IODispatcher 
					className="block min-h-[3px] w-full touch-none pointer-events-none select-none bg-red-500"
					dispatch={{
						"top-in": () => console.log( "RED: top-in static" ),
						"top-out": () => console.log( "RED: top-out static" )
					}} 
				/>
			</div>
			{ children }
		</>
	);
}