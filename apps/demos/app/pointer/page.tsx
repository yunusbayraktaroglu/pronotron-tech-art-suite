"use client";

import { useEffect, useRef, useState } from "react";

export default function PointerDemoPage()
{
	const { elapsedTime, activeElapsedTime, pointer, pointerDelta, clockDelta, easedPointer } = useAppTicker();

	useEffect(() => {
		console.log( "pointer delta changed" );
	}, [ pointerDelta ]);

	return (
		<>
			<span style={{
				zIndex: 99999,
				background: "red",
				width: 10,
				height: 10,
				position: "fixed",
				left: easedPointer.current.x,
				top: easedPointer.current.y,
			}}></span>
			<div className="flex flex-col h-[80vh] relative bg-slate-300">
				<p>Time:</p>
				<p>{ elapsedTime }</p>
				<p>{ activeElapsedTime }</p>
				<p>{ pointerDelta.x }, { pointerDelta.y }</p>
				<p>{ clockDelta }</p>
				<p>{ easedPointer.current.x }</p>
			</div>
			<div className="flex flex-col h-[90vh] relative bg-slate-500" />
		</>
	);
}



import { PronotronTouch, PronotronMouse } from "@pronotron/pointer";
import { PronotronAnimationController, PronotronClock } from "@pronotron/utils";
import { Vector2 } from "@pronotron/pointer/src/core/Vector2";

function useAppTicker()
{
	const easedPointer = useRef<V2>( new Vector2( 0, 0 ) );

	const clock = useRef( new PronotronClock() );
	const animationController = useRef( new PronotronAnimationController( clock.current ) );
	const pointerController = useRef( new PronotronMouse( window, animationController.current, clock.current ) );

	const [ elapsedTime, setElapsedTime ] = useState( 0 );
	const [ activeElapsedTime, setActiveElapsedTime ] = useState( 0 );
	
	const [ pointer, setPointer ] = useState({ x: 0, y: 0 });
	const [ pointerDelta, setPointerDelta ] = useState({ x: 0, y: 0 });

	const [ clockDelta, setClockDelta ] = useState( 0 );

	useEffect(() => {

		pointerController.current.startEvents();

		const tick = () => {
			clock.current.tick();
			animationController.current.tick();

			setElapsedTime( clock.current.elapsedTime );
			setActiveElapsedTime( clock.current.elapsedPausedTime );
			setPointer( pointerController.current._pointerStart );
			setPointerDelta( pointerController.current._pointerDelta );

			const dt = clock.current.getDelta();
			setClockDelta( dt );

			easedPointer.current = ease( pointerController.current._pointerStart, easedPointer.current, dt );

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

	return { elapsedTime, activeElapsedTime, pointer, pointerDelta, clockDelta, easedPointer };
}




type V2 = { x: number, y: number };

function ease( target: V2, source: V2, deltaTime: number, speed = 2000, eps = 0.001 )
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