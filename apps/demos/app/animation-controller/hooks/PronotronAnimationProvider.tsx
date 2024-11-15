"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { PronotronAnimationController, PronotronClock } from "@pronotron/utils";

import { stats } from "@/app/components/PerformanceStats";

const clock = new PronotronClock();
export const animationController = new PronotronAnimationController( clock, 50 );

interface AppTickerContextProps {
	elapsedTime: number;
	activeElapsedTime: number;
	clockDelta: number;
}

const AppTickerContext  = createContext<AppTickerContextProps | undefined>( undefined );

export function PronotronAnimationControllerProvider({ children }: { children: React.ReactNode })
{
	const [ clockDelta, setClockDelta ] = useState( 0 );
	const [ elapsedTime, setElapsedTime ] = useState( 0 );
	const [ activeElapsedTime, setActiveElapsedTime ] = useState( 0 );

	useEffect(() => {

		let animationFrameId = 0;

		const tick = () => {
			const deltaTime = clock.tick();
			stats.begin();
			animationController.tick();
			stats.end();
			setElapsedTime( clock.elapsedTime );
			setActiveElapsedTime( clock.elapsedPausedTime );
			setClockDelta( deltaTime );
			animationFrameId = requestAnimationFrame( tick );
		};

		animationFrameId = requestAnimationFrame( tick );

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
			stats.resetPanels();
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

