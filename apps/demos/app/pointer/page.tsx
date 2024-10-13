"use client";

import { useEffect, useRef, useState } from "react";

export default function PointerDemoPage()
{
	//const { elapsedTime, activeElapsedTime, pointer, pointerDelta, clockDelta, easedPointer } = useAppTicker();

	// useEffect(() => {
	// 	console.log( "pointer delta changed" );
	// }, [ pointerDelta ]);

	//console.log( "rerender" );

	return (
		<AppTickerProvider>
			<div className="pointer" />
			<PointerComponent />
			<div className="flex flex-col h-[80vh] relative bg-slate-300 holdable" />
			<div className="flex flex-col h-[90vh] relative bg-slate-500" />
		</AppTickerProvider>
	);
}

const PointerComponent = () => {
	const { pointer, easedPointer, elapsedTime, pointerState } = useAppTicker();
	return (
		<div className="fixed left-0 top-0 p-3 z-50">
			<p>Pointer State: { pointerState }</p>
			<p>Pointer: {pointer.x}, {pointer.y}</p>
			{/* <p>Eased Pointer: {easedPointer.x}, {easedPointer.y}</p> */}
		</div>
	);
};










interface AppTickerContextProps {
	easedPointer: { x: number; y: number };
	elapsedTime: number;
	activeElapsedTime: number;
	pointer: { x: number; y: number };
	pointerDelta: { x: number; y: number };
	clockDelta: number;
	pointerState: string;
}

import { createContext, useContext } from "react";
const AppTickerContext  = createContext<AppTickerContextProps | undefined>( undefined );



import { PronotronTouch, PronotronMouse } from "@pronotron/pointer";
import { PronotronAnimationController, PronotronClock } from "@pronotron/utils";
import { Vector2 } from "@pronotron/pointer/src/core/Vector2";

function AppTickerProvider({ children }: { children: React.ReactNode })
{
	const easedPointer = useRef<V2>( new Vector2( 0, 0 ) );

	const clock = useRef( new PronotronClock() );
	const animationController = useRef( new PronotronAnimationController( clock.current ) );
	const pointerController = useRef( new PronotronTouch( window, animationController.current, clock.current ) );

	const [ elapsedTime, setElapsedTime ] = useState( 0 );
	const [ activeElapsedTime, setActiveElapsedTime ] = useState( 0 );
	
	const [ pointer, setPointer ] = useState({ x: 0, y: 0 });
	const [ pointerDelta, setPointerDelta ] = useState({ x: 0, y: 0 });

	const [ clockDelta, setClockDelta ] = useState( 0 );
	const [ pointerState, setPointerState ] = useState( "" );

	useEffect(() => {

		pointerController.current.startEvents();

		const tick = () => {

			const deltaTime = clock.current.tick();
			animationController.current.tick();

			setElapsedTime( clock.current.elapsedTime );
			setActiveElapsedTime( clock.current.elapsedPausedTime );

			setPointer( pointerController.current.getPosition() );
			setPointerDelta( pointerController.current.getMovement() );
			setPointerState( pointerController.current.getCurrentState() );

			setClockDelta( deltaTime );

			easedPointer.current = ease( pointerController.current.getPosition(), easedPointer.current, deltaTime );

			document.documentElement.style.setProperty("--x", easedPointer.current.x + "px");
			document.documentElement.style.setProperty("--y", easedPointer.current.y + "px");

			requestAnimationFrame( tick );

		};

		const animationFrameId = requestAnimationFrame( tick );

		const handleVisibilityChange = () => {
			if ( document.hidden ){
				clock.current.pause();
			} else {
				clock.current.continue();
			}
		};

		document.addEventListener( 'visibilitychange', handleVisibilityChange );

		return () => {
			cancelAnimationFrame( animationFrameId );
			document.removeEventListener( 'visibilitychange', handleVisibilityChange );
			pointerController.current.stopEvents();
		};
		
	}, []);

	useEffect(() => {

		const holdHandler = ( event: CustomEvent ) => {
			console.log( "HOLD", event )
		};

		const tapHandler = ( event: CustomEvent ) => {
			console.log( "TAP", event )
		};

		window.addEventListener( "hold", holdHandler as EventListener );
		window.addEventListener( "tap", tapHandler as EventListener );

		return () => {
			window.removeEventListener( "hold", holdHandler as EventListener );
			window.removeEventListener( "tap", tapHandler as EventListener );
		}

	}, []);

	return (
		<AppTickerContext.Provider
			value={{
				easedPointer: { x: easedPointer.current.x, y: easedPointer.current.y },
				elapsedTime,
				activeElapsedTime,
				pointer,
				pointerDelta,
				clockDelta,
				pointerState
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


type V2 = { x: number, y: number };

function ease( target: V2, source: V2, deltaTime: number, speed = 5, eps = 0.001 )
{
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distanceSquared = dx * dx + dy * dy; // Calculate distance squared

    // Snap to target if the distance is less than eps
    if (distanceSquared < eps * eps) {
        return { x: target.x, y: target.y };
    }

    // Calculate easing factor based on deltaTime and speed
    const factor = 1 - Math.exp(-speed * deltaTime);

    // Calculate the new position directly
    return {
        x: source.x + dx * factor,
        y: source.y + dy * factor,
    };
}