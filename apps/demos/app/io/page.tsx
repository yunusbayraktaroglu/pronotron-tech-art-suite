"use client";

import { IODispatcher } from "./hooks/usePronotronIO";

export default function Home()
{
	return (
		<>
			<div className="flex h-[40vh] landscape:h-[120vh] relative"></div>
			<IODispatcher 
				className='bg-black py-[50px]'
				offset={ 0 }
				dispatch={{
					onTopIn: () => console.log( "Top-in" ),
					onTopOut: () => console.log( "Top-out" ),
					onBottomOut: () => console.log( "Bottom-out" ),
					onBottomIn: () => console.log( "Bottom-in" ),
					onInViewport: ( normalizedPosition: number ) => {
						console.log( "in viewport", normalizedPosition );
					},
					//onFastForward: "execute_both"
				}}
			/>
			<div className="flex h-[40vh] landscape:h-[140vh] relative"></div>
		</>
	)
}