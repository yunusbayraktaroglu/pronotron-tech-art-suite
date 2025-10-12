"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { TouchController, MouseController } from "@pronotron/pointer";
import { PronotronAnimator, PronotronClock, isTouchDevice } from "@pronotron/utils";

export const defaultPointerSettings = {
	tapThreshold: 0.25,
	idleThreshold: 0.5,
	holdThreshold: 0.75,
	movingDeltaLimit: 10,
};

interface PointerContextProps {
	pointerController: React.MutableRefObject<TouchController | MouseController>;
};

const PointerContext = createContext<PointerContextProps | undefined>( undefined );

export const usePointerContext = () => {
	const context = useContext( PointerContext );
	if ( ! context ){
	  	throw new Error( "usePointerContext must be used within a PronotronPointerProvider" );
	}
	return context;
};

export function PronotronPointerProvider({ children }: { children: React.ReactNode })
{
	const clock = useRef( new PronotronClock() );
	const animator = useRef( new PronotronAnimator( clock.current ) );
	const pointerController = useRef<TouchController | MouseController>( null ! );

	/**
	 * Pointer controller setup
	 */
	useEffect(() => {

		const baseSettings = {
			target: window.document.body,
			animator: animator.current,
			clock: clock.current,
			isInteractable: ( target: HTMLElement ) => {
				// If target inside an <a>, <button> or .holdable return true
				if ( target.closest( "a" ) || target.closest( "button" ) || target.closest( ".holdable" ) ){
					return true;
				}
				return false;
			},
			isHoldable: ( target: HTMLElement ) => {
				return target.dataset.holded ? true : false;
			}
		};
		const settings = { ...baseSettings, ...defaultPointerSettings };

		if (  isTouchDevice() ){
			pointerController.current = new TouchController( settings );
		} else {
			pointerController.current = new MouseController( settings );
		}

		pointerController.current.startEvents();

		let animationFrameId = 0;

		const tick = () => {
			const deltaTime = clock.current.tick();
			animator.current.tick();
			animationFrameId = requestAnimationFrame( tick );
		};

		animationFrameId = requestAnimationFrame( tick );

		const handleVisibilityChange = () => {
			if ( document.hidden ){
				clock.current.pause();
			} else {
				clock.current.resume();
			}
		};

		document.addEventListener( 'visibilitychange', handleVisibilityChange );

		return () => {
			cancelAnimationFrame( animationFrameId );
			document.removeEventListener( 'visibilitychange', handleVisibilityChange );
			pointerController.current.stopEvents();
		};
		
	}, []);

	/**
	 * CustomEvent listeners
	 */
	useEffect(() => {

		const holdHandler = ( event: CustomEvent ) => {
			document.documentElement.classList.add( "holding" );
			console.log( "HOLD", event );
		};
		const holdendHandler = ( event: CustomEvent ) => {
			document.documentElement.classList.remove( "holding" );
			console.log( "HOLD-END", event );
		};
		const tapHandler = ( event: CustomEvent ) => {
			console.log( "TAP", event );
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
		<PointerContext.Provider value={{ pointerController }}>
			{ children }
		</PointerContext.Provider>
	);
}