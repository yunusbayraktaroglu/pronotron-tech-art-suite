"use client";

import { useMemo } from "react";
import { IODispatcher } from "../../hooks/usePronotronIO";

export default function SharedNodePageTwo()
{
	const colors = useMemo(() => {
		return [
			"bg-red-500",
			"bg-orange-500",
			"bg-purple-500",
			"bg-green-500",
			"bg-teal-500"
		];
	}, []);

	return Array.from({ length: 10 }).map(( item, index ) => (
		<IODispatcher 
			key={ index }
			className={ `block py-[1px] my-[40vh] landscape:my-[140vh] ${ colors[ index % 5 ] }` }
			offset={ 0 }
			dispatch={{
				onTopIn: () => console.log( `#${ index } Top-in` ),
				onTopOut: () => console.log( `#${ index } Top-out` ),
				onBottomOut: () => console.log( `#${ index } Bottom-out` ),
				onBottomIn: () => console.log( `#${ index } Bottom-in` ),
				onInViewport: ( normalizedPosition: number ) => {
					console.log( `#${ index } In Viewport`, normalizedPosition );
				},
				onFastForward: "execute_both"
			}}
			onRemoveNode={() => console.log( "IO Node removed" )}
		>
			<p className="text-center">Node: #{ index }</p>
		</IODispatcher>
	));
}