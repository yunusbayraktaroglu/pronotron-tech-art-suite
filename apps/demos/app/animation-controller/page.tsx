"use client";

import { useEffect, useRef, useState } from "react";
import { PronotronAnimationController, PronotronClock } from "@pronotron/utils";

const clock = new PronotronClock();
const animationController = new PronotronAnimationController( clock, 50 );

export default function AnimationControllerDemoPage()
{
	return (
		<AppTickerProvider>
			<p>PronotronAnimationController uses TypedArray to hold animations in flatten typed array and iterates over it with using direct access to memory</p>
			<p>Adds 50 animation</p>
			<p>FPS: <span><FPSTracker /></span></p>
			<div className="grid grid-cols-4 gap-3">
				{ Array.from({ length: 50 }).map(( item, index ) => (
					<SingleAnimation key={ index } ID={ index } /> 
				) )}
			</div>
		</AppTickerProvider>
	);
}

function SingleAnimation({ ID }: { ID: number })
{
	const [ timeline, setTimeline ] = useState( 0 );
	const [ state, setState ] = useState( "running" );

	useEffect(() => {
		setState( "running" );
		animationController.addAnimation({
			id: `animation_${ ID }`,
			duration: 4.125 + ( ID + 1 ) / 20,
			onRender: ( currentTime, startTime, duration ) => {
				const timeline = ( currentTime - startTime ) / duration;
				setTimeline( Math.min( timeline, 1.0 ) );
			},
			onEnd: () => {
				setState( "end" );
				if ( animationController.getAnimationCount() < 2 ){
					console.log( animationController );
				}
				//console.log( `Finish: animation_${ ID }` )
			},
			timeStyle: "pausable",
			forceFinish: "runOnEnd"
		});
		return () => animationController.removeAnimation( `animation_${ ID }`, true );
	}, []);

	return (
		<div className={ state === "running" ? "p-3 bg-orange-300" : "p-3 bg-green-300" }>
			<h1>Animation: #{ ID }</h1>
			<div className="w-full block bg-red-500 h-[5px] origin-left" style={{ transform: `translate3d( 0, 0, 0 ) scaleX(${ timeline })`}} />
		</div>
	)
}



function FPSTracker()
{
	const appTicker = useAppTicker();
	return appTicker.fps
}

interface AppTickerContextProps {
	elapsedTime: number;
	activeElapsedTime: number;
	clockDelta: number;
	fps: number;
}

import { createContext, useContext } from "react";
const AppTickerContext  = createContext<AppTickerContextProps | undefined>( undefined );


function AppTickerProvider({ children }: { children: React.ReactNode })
{
	const [ clockDelta, setClockDelta ] = useState( 0 );
	const [ elapsedTime, setElapsedTime ] = useState( 0 );
	const [ activeElapsedTime, setActiveElapsedTime ] = useState( 0 );
	const [ fps, setFps ] = useState( 0 );

	useEffect(() => {

		const tick = () => {
			const deltaTime = clock.tick();
			animationController.tick();
			setElapsedTime( clock.elapsedTime );
			setActiveElapsedTime( clock.elapsedPausedTime );
			setClockDelta( deltaTime );
			setFps( Math.round( 1.0 / deltaTime ) );
			requestAnimationFrame( tick );
		};

		const animationFrameId = requestAnimationFrame( tick );

		const handleVisibilityChange = () => {
			if ( document.hidden ){
				clock.pause();
			} else {
				clock.continue();
			}
		};

		document.addEventListener( 'visibilitychange', handleVisibilityChange );

		return () => {
			cancelAnimationFrame( animationFrameId );
			document.removeEventListener( 'visibilitychange', handleVisibilityChange );
		};
		
	}, []);

	return (
		<AppTickerContext.Provider
			value={{
				elapsedTime,
				activeElapsedTime,
				clockDelta,
				fps
			}}
		>
			{ children }
		</AppTickerContext.Provider>
	);
}


export const useAppTicker = () => {
	const context = useContext( AppTickerContext );
	if ( ! context ){
	  	throw new Error( "useAppTicker must be used within an AppTickerProvider" );
	}
	return context;
}

