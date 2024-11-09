"use client";

import { useEffect, useState } from "react";
import { PronotronAnimationController, PronotronClock } from "@pronotron/utils";
import { PronotronStats, PronotronStatsComponent } from "@/app/components/PerformanceStats";

const clock = new PronotronClock();
const animationController = new PronotronAnimationController( clock, 50 );
const stats = new PronotronStats();

export default function AnimationControllerDemoPage()
{
	return (
		<AppTickerProvider>
			<PronotronStatsComponent stats={ stats } />
			<p>PronotronAnimationController uses TypedArray to hold animations in flatten typed array and iterates over it with using direct access to memory</p>
			<p>Adds 50 animation</p>
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
			onEnd: ( forced ) => {
				if ( forced ){
					console.log( "forcibly finished" )
				}
				if ( animationController.getAnimationCount() < 2 ){
					console.log( animationController );
				}
				setState( "end" );
			},
			timeStyle: "pausable",
		});
		return () => animationController.removeAnimation( `animation_${ ID }`, true );
	}, []);

	return (
		<div className={ state === "running" ? "p-3 bg-orange-300" : "p-3 bg-green-300" }>
			<h1>Animation: #{ ID }</h1>
			<div className="w-full block bg-slate-900 h-[5px] origin-left" style={{ transform: `translate3d( 0, 0, 0 ) scaleX(${ timeline })`}} />
		</div>
	)
}


interface AppTickerContextProps {
	elapsedTime: number;
	activeElapsedTime: number;
	clockDelta: number;
}

import { createContext, useContext } from "react";
const AppTickerContext  = createContext<AppTickerContextProps | undefined>( undefined );


function AppTickerProvider({ children }: { children: React.ReactNode })
{
	const [ clockDelta, setClockDelta ] = useState( 0 );
	const [ elapsedTime, setElapsedTime ] = useState( 0 );
	const [ activeElapsedTime, setActiveElapsedTime ] = useState( 0 );

	useEffect(() => {

		const tick = () => {
			stats.begin();
			const deltaTime = clock.tick();
			animationController.tick();
			setElapsedTime( clock.elapsedTime );
			setActiveElapsedTime( clock.elapsedPausedTime );
			setClockDelta( deltaTime );
			stats.end();
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

