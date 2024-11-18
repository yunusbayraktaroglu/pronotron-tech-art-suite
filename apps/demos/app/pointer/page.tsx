"use client";

import { useEffect, useRef, useState } from "react";

export default function PointerDemoPage()
{
	return (
		<AppTickerProvider>
			<PointerView />
			<div className="bg-black/25 sticky top-0 z-50 py-spacing-sm">
				<div className="container">
					<PointerDebugger />
				</div>
			</div>
			<div className="container my-spacing-base flex flex-col gap-3">
				<div className="flex flex-col items-center justify-center h-[50vh] relative bg-slate-300 p-3">
					<div data-holded className="holdable flex items-center justify-center bg-slate-500 h-[10vh] w-[10vh]">
						<div className="pointer-events-none">
							<p>Holdable</p>
						</div>
					</div>
				</div>
				<div className="flex flex-col h-[50vh] relative bg-slate-500" />
			</div>
		</AppTickerProvider>
	);
}




function PointerDebugger()
{
	const { pointer, pointerDelta, pointerState } = useAppTicker();

	return (
		<>
			<p>Pointer State: { pointerState }</p>
			<p>Position: { pointer.x }, { pointer.y }</p>
			<p>Delta: { pointerDelta.x }, { pointerDelta.y }</p>
		</>
	);
}




function PointerView()
{
	const { pointer, pointerState, pointerTargetInteractable } = useAppTicker();

	return (
		<div 
			data-attz={ pointer.x }
			className={ "pointer " + pointerState + " " + ( pointerTargetInteractable ? "interactable" : "" ) }
			style={{ "--x": `${ pointer.x }px`, "--y": `${ pointer.y }px` } as React.CSSProperties }
		/>
	)
}









interface AppTickerContextProps {
	pointer: { x: number; y: number };
	pointerDelta: { x: number; y: number };
	pointerTargetInteractable: boolean;
	pointerState: string;
}

import { createContext, useContext } from "react";
const AppTickerContext  = createContext<AppTickerContextProps | undefined>( undefined );



import { PronotronTouch, PronotronMouse } from "@pronotron/pointer";
import { PronotronAnimationController, PronotronClock, isTouchDevice } from "@pronotron/utils";

function AppTickerProvider({ children }: { children: React.ReactNode })
{
	const clock = useRef( new PronotronClock() );
	const animationController = useRef( new PronotronAnimationController( clock.current ) );
	const pointerController = useRef<PronotronMouse | PronotronTouch>( null ! );
	
	const [ pointer, setPointer ] = useState({ x: 0, y: 0 });
	const [ pointerDelta, setPointerDelta ] = useState({ x: 0, y: 0 });

	const [ clockDelta, setClockDelta ] = useState( 0 );
	const [ pointerState, setPointerState ] = useState( "" );
	const [ pointerTargetInteractable, setPointerTargetInteractable ] = useState<boolean>( false );

	useEffect(() => {

		const touch = isTouchDevice();

		if ( touch ){
			pointerController.current = new PronotronTouch( window, animationController.current, clock.current );
		} else {
			pointerController.current = new PronotronMouse( window, animationController.current, clock.current );
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

		window.addEventListener( "hold", holdHandler as EventListener );
		window.addEventListener( "holdend", holdendHandler as EventListener );
		window.addEventListener( "tap", tapHandler as EventListener );

		return () => {
			window.removeEventListener( "hold", holdHandler as EventListener );
			window.removeEventListener( "holdend", holdendHandler as EventListener );
			window.removeEventListener( "tap", tapHandler as EventListener );
		}

	}, []);

	return (
		<AppTickerContext.Provider
			value={{
				pointer,
				pointerDelta,
				pointerTargetInteractable,
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
