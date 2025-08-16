"use client";

import { useState } from "react";
import { IODispatcher } from "./hooks/usePronotronIO";

export default function HomePage()
{
	return (
		<>
			<h2 className="italic text-slate-400 text-center">Scroll down...</h2>
			<div className="my-[120vh] text-center">
				<SingleDispatcher />
			</div>
			<h2 className="italic text-slate-400 text-center">Scroll up...</h2>
		</>
	)
}

function SingleDispatcher()
{
	const [ pos, setPos ] = useState<number>( 0 );
	const [ state, setState ] = useState<false | string>( false );

	return ( 
		<div className="container border-l-2 border-r-2 border-black border-dashed">
			<p className="text-sm">Last recorded event: { state ? state : null }</p>
			<IODispatcher 
				className='py-spacing-lg my-spacing-base border-b border-t border-slate-500'
				style={{ backgroundColor: `rgba( 0, 255, 0, ${ Math.abs( pos ) })` }}
				offset={ 0 }
				dispatch={{
					onTopIn: () => setState( "Top-in" ),
					onTopOut: () => setState( "Top-out" ),
					onBottomIn: () => setState( "Bottom-in" ),
					onBottomOut: () => setState( "Bottom-out" ),
					onInViewport: ( normalizedPosition: number ) => {
						setPos( normalizedPosition );
					},
					onFastForward: "execute_both"
				}}
				onRemoveNode={() => console.log( "IO Node removed" )}
			>
				<p className="text-sm">Normalized Position: { pos.toFixed( 2 ) }</p>
			</IODispatcher>
			<p className="text-sm">Last recorded event: { state ? state : null }</p>
		</div>
	)
}