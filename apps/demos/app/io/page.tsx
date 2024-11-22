"use client";

import { useEffect, useState } from "react";
import { IODispatcher } from "./hooks/usePronotronIO";
import { usePerformanceStats } from "../hooks/usePerformanceStats";

export default function HomePage()
{
	const { setIsActive } = usePerformanceStats();
	const [ pos, setPos ] = useState<number>( 0 );
	const [ state, setState ] = useState<false | string>( false );

	useEffect(() => {
		setIsActive( true );
	}, []);

	return (
		<>
			<div className="container text-center my-spacing-base">
				<h2 className="italic text-slate-300">Scroll down...</h2>
			</div>
			<div className="my-[120vh] text-center">
				<p>Last recorded event: { state ? state : null }</p>
				<IODispatcher 
					className='py-spacing-lg my-spacing-base border-b border-t border-black'
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
						//onFastForward: "execute_both"
					}}
				>
					<p>Normalized Position: { pos }</p>
				</IODispatcher>
				<p>Last recorded event: { state ? state : null }</p>
			</div>
			<div className="container text-center my-spacing-base">
				<h2 className="italic text-slate-300">Scroll up...</h2>
			</div>
		</>
	)
}