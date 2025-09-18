"use client";

import { useEffect, useState, useRef } from "react";
import { animationController } from "../hooks/PronotronAnimatorProvider";

export function SingleAnimation({ ID, timeStyle }: { ID: number, timeStyle: "pausable" | "continious" })
{
	const [ timeline, setTimeline ] = useState( 0 );
	const [ state, setState ] = useState( "waiting" );
	const [ hasEndedNaturally, setHasEndedNaturally ] = useState( false );

	useEffect(() => {
		animationController.addAnimation({
			id: `animation_${ ID }`,
			duration: ( 10 + ID ) / 10,
			onRender: ( currentTime, startTime, duration ) => {
				const timeline = ( currentTime - startTime ) / duration;
				setTimeline( Math.min( timeline, 1.0 ) );
			},
			onEnd: ( forced ) => {
				if ( ! forced ){
					setState( "end" );
					setHasEndedNaturally( true );
				} 
			},
			timeStyle: timeStyle,
		});
		setState( "running" );
	}, []);

	useEffect(() => {
		return () => {
			if ( ! hasEndedNaturally && state === "running" ){
				animationController.removeAnimation( `animation_${ ID }`, true );
			}
		}
	}, [ hasEndedNaturally ]);

	const colorClass = state === "running" ? "p-3 bg-orange-300" : "p-3 bg-green-300";

	return (
		<div className={ colorClass }>
			<p className="text-xs">Animation: #{ ID }</p>
			<div className="w-full block bg-slate-900 h-[5px] origin-left" style={{ transform: `translate3d( 0, 0, 0 ) scaleX(${ timeline })`}} />
		</div>
	)
}