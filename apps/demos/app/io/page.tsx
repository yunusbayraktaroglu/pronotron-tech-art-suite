"use client";

import { useState } from "react";
import { IODispatcherDebug } from "./components/IODispatcher";
import { TrackingAreaVisualizer } from "./components/TrackingAreaVisualizer";

export default function HomePage()
{
	return (
		<>
			<TrackingAreaVisualizer />
			<h2 className="italic text-slate-400 opacity-50 text-center">Scroll down...</h2>
			<div className="my-[120vh] text-center">
				<SingleDispatcher />
			</div>
			<h2 className="italic text-slate-400 opacity-50 text-center">Scroll up...</h2>
		</>
	)
}

function SingleDispatcher()
{
	const [ position, setPosition ] = useState<number>( 0 );
	const [ scrollProgress, setScrollProgress ] = useState<number>( 0 );
	const [ state, setState ] = useState<false | string>( false );

	return ( 
		<div className="container border-l-2 border-r-2 border-black border-dashed">
			<p className="text-sm leading-none">Last recorded event: { state ? state : null }</p>
			<IODispatcherDebug 
				className='py-spacing-xl my-spacing-base border-b border-t border-slate-500'
				style={{ backgroundColor: `rgba( 0, 255, 0, ${ Math.abs( position ) })` }}
				offset={ 0 }
				dispatch={{
					onInViewport: ( normalizedPosition ) => setPosition( normalizedPosition ),
					onScrollProgress: ( scrollProgress ) => setScrollProgress( scrollProgress ),
					onEnter: () => console.log( "Enter!" ),
					onExit: () => console.log( "Exit!" ),
					onTopEnter: () => setState( "Top-enter" ),
					onTopExit: () => setState( "Top-exit" ),
					onBottomEnter: () => setState( "Bottom-enter" ),
					onBottomExit: () => setState( "Bottom-exit" ),
					onFastForward: "execute_both"
				}}
				onRemoveNode={() => console.log( "IO Node removed" )}
			>
				<p className="text-sm leading-none">Normalized Position: { position.toFixed( 2 ) }</p>
				<p className="text-sm leading-none mt-spacing-base">OnScroll Progress: { scrollProgress.toFixed( 2 ) }</p>
			</IODispatcherDebug>
			<p className="text-sm leading-none">Last recorded event: { state ? state : null }</p>
		</div>
	)
}