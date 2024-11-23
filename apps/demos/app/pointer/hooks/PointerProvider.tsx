"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { TouchBase, TouchHoldable, MouseHoldable, MouseBase } from "@pronotron/pointer";
import { PronotronAnimationController, PronotronClock, isTouchDevice } from "@pronotron/utils";

export const pointerSettings = {
	idleTreshold: 0.6,
	movingDeltaLimit: 10,
	holdTreshold: 0.35
};

interface PointerContextProps {
	pointer: { x: number; y: number };
	pointerDelta: { x: number; y: number };
	pointerTargetInteractable: boolean;
	pointerState: string;
};

const PointerContext = createContext<PointerContextProps | undefined>( undefined );

export const usePointerContext = () => {
	const context = useContext( PointerContext );
	if ( ! context ){
	  	throw new Error("useAppTicker must be used within an AppTickerProvider");
	}
	return context;
}

export function PronotronPointerProvider({ children }: { children: React.ReactNode })
{
	const clock = useRef( new PronotronClock() );
	const animationController = useRef( new PronotronAnimationController( clock.current ) );
	const pointerController = useRef<TouchHoldable | TouchBase | MouseHoldable | MouseBase>( null ! );
	
	const [ pointer, setPointer ] = useState({ x: 0, y: 0 });
	const [ pointerDelta, setPointerDelta ] = useState({ x: 0, y: 0 });

	const [ clockDelta, setClockDelta ] = useState( 0 );
	const [ pointerState, setPointerState ] = useState( "" );
	const [ pointerTargetInteractable, setPointerTargetInteractable ] = useState<boolean>( false );

	useEffect(() => {

		const settings = {
			target: window.document.body,
			animationController: animationController.current,
			clock: clock.current,
			idleTreshold: pointerSettings.idleTreshold,
			movingDeltaLimit: pointerSettings.movingDeltaLimit,
			holdTreshold: pointerSettings.holdTreshold,
			isInteractable: ( target: HTMLElement ) => {
				return target.classList.contains( "holdable" ) || target.tagName === "A";
			},
			isHoldable: ( target: HTMLElement ) => {
				return target.dataset.holded ? true : false;
			}
		};

		const touch = isTouchDevice();

		if ( touch ){
			pointerController.current = new TouchHoldable( settings );
		} else {
			pointerController.current = new MouseHoldable( settings );
		}

		pointerController.current.startEvents();

		let animationFrameId = 0;

		const tick = () => {

			const deltaTime = clock.current.tick();
			animationController.current.tick();

			setPointer( pointerController.current.getPosition() );
			setPointerDelta( pointerController.current.getMovement() );
			setPointerState( pointerController.current.getCurrentState() );
			setPointerTargetInteractable( pointerController.current.getTargetInteractable() );
			setClockDelta( deltaTime );

			animationFrameId = requestAnimationFrame( tick );

		};

		animationFrameId = requestAnimationFrame( tick );

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
		const holdendHandler = ( event: CustomEvent ) => {
			console.log( "HOLD-END", event )
		};
		const tapHandler = ( event: CustomEvent ) => {
			console.log( "TAP", event )
		};

		window.document.body.addEventListener( "hold", holdHandler as EventListener );
		window.document.body.addEventListener( "holdend", holdendHandler as EventListener );
		window.document.body.addEventListener( "tap", tapHandler as EventListener );

		return () => {
			window.document.body.removeEventListener( "hold", holdHandler as EventListener );
			window.document.body.removeEventListener( "holdend", holdendHandler as EventListener );
			window.document.body.removeEventListener( "tap", tapHandler as EventListener );
		}

	}, []);

	return (
		<PointerContext.Provider
			value={{
				pointer,
				pointerDelta,
				pointerTargetInteractable,
				pointerState
			}}
		>
			{ children }
		</PointerContext.Provider>
	);
}

