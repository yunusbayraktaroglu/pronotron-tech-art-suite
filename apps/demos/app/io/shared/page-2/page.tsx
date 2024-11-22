"use client";

import React from "react";
import { IODispatcher } from "../../hooks/usePronotronIO";

const colors = [
	"bg-teal-500",
	"bg-orange-500",
	"bg-purple-500",
	"bg-green-500",
	"bg-red-500",
];

export default function SharedPageTwo()
{
	return Array.from({ length: 10 }).map(( item, index ) => (
		<IODispatcher 
			key={ index }
			className={ `block py-[1px] my-[40vh] landscape:my-[140vh] ${ colors[ index % 5 ] }` }
			offset={ 0 }
			dispatch={{
				onTopIn: () => console.log( `#${ index } Top-in` ),
				onTopOut: () => console.log( `#${ index } Top-out` ),
				onBottomOut: () => console.log( `#${ index } Bottom-out` ),
				onBottomIn: () => console.log( `#${ index } Bottomin` ),
				onInViewport: ( normalizedPosition: number ) => {
					console.log( `#${ index } In Viewport`, normalizedPosition );
				},
				//onFastForward: "execute_both"
			}}
		>
			<p className="text-center">Node: #{ index }</p>
		</IODispatcher>
			
	))
}