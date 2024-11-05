"use client";

import { useEffect, useRef, useState } from "react";
import { PronotronAnimationController, PronotronClock } from "@pronotron/utils";

const clock = new PronotronClock();
const animationController = new PronotronAnimationController( clock, 50 );


export default function AnimationControllerDemoPage()
{
	return (
		<AppTickerProvider>
			<div className="flex flex-col h-[80vh] relative bg-slate-300 holdable" />
			<div className="flex flex-col h-[90vh] relative bg-slate-500" />
			<AnimationTestCase />
		</AppTickerProvider>
	);
}

function AnimationTestCase()
{
	/**
	 * In strict mode will add and remove sequancely
	 */
	useEffect(() => {

		for ( let i = 0; i < 20; i++ ){
			animationController.addAnimation({
				id: `animation_${ i }`,
				duration: 4,
				onEnd: () => {
					console.log( `Finish: animation_${ i }` )
				},
				timeStyle: "pausable",
				forceFinish: "runOnEnd"
			});
		}

		return () => {
			for ( let i = 0; i < 20; i++ ){
				animationController.removeAnimation( `animation_${ i }`, true )
			}
		}
	});

	return null;
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
			const deltaTime = clock.tick();
			animationController.tick();

			setElapsedTime( clock.elapsedTime );
			setActiveElapsedTime( clock.elapsedPausedTime );
			setClockDelta( deltaTime );

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
	  	throw new Error("useAppTicker must be used within an AppTickerProvider");
	}
	return context;
}

