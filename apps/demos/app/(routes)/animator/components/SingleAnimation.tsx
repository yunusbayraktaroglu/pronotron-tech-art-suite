"use client";

import { useEffect, useState } from "react";
import { type AnimationOption } from "@pronotron/utils";

import { animator } from "../hooks/PronotronAnimatorProvider";

type BaseAnimationSettings = Pick<AnimationOption, "id" | "delay" | "autoPause">;

export function SingleAnimation({ id, autoPause, delay }: BaseAnimationSettings)
{
	const [ state, setParentState ] = useState<"running" | "waiting" | "end">( "waiting" );
	const colorClass = state === "running" ? "p-3 bg-orange-300" : "p-3 bg-green-300";

	return (
		<div className={ colorClass }>
			<p className="text-xs">Animation: #{ id }</p>
			<AnimationTimeline { ...{ id, autoPause, delay, setParentState } } />
		</div>
	)
}

type AnimationTimelineProps = BaseAnimationSettings & {
	setParentState: React.Dispatch<React.SetStateAction<"running" | "waiting" | "end">>
};

function AnimationTimeline({ id, autoPause, delay, setParentState }: AnimationTimelineProps)
{
	const [ timeline, setTimeline ] = useState( 0 );
	const [ state, setState ] = useState<"running" | "waiting" | "end">( "waiting" );
	const [ hasEndedNaturally, setHasEndedNaturally ] = useState( false );

	useEffect(() => {
		animator.add({
			id: `animation_${ id }`,
			duration: ( 10 + Number( id ) ) / 10,
			delay,
			autoPause,
			onRender: ( currentTime, startTime, duration ) => {
				const timeline = ( currentTime - startTime ) / duration;
				setTimeline( Math.min( timeline, 1.0 ) );
			},
			onEnd: ( forced ) => {
				if ( ! forced ){
					setState( "end" );
					setParentState( "end" );
					setHasEndedNaturally( true );
				} 
			}
		});
		setState( "running" );
		setParentState( "running" );
	}, []);

	useEffect(() => {
		return () => {
			if ( ! hasEndedNaturally && state === "running" ){
				animator.remove( `animation_${ id }`, true );
			}
		}
	}, [ hasEndedNaturally ]);

	return (
		<div className="w-full block bg-slate-900 h-[5px] origin-left" style={{ transform: `translate3d( 0, 0, 0 ) scaleX(${ timeline })`}} />
	)
}




function AnimationTest()
{
	const anim = animator.add({
		id: `TEST_ANIMATION`,
		duration: 3.0,
		delay: 0.5,
		autoPause: true,
		onBegin: () => {
			console.log( "ANIMATION BEGUN" );
		},
		onRender: ( currentTime, startTime, duration ) => {
			const timeline = ( currentTime - startTime ) / duration;
		},
		onEnd: ( forced ) => {
			if ( ! forced ){
				console.log( "ANIMATION FINISHED NATURALLY" )
			} 
		},
	});

}