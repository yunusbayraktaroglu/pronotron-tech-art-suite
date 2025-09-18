"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePointerContext } from "./PointerProvider";

interface PointerDataContextProps {
	pointerPosition: { x: number; y: number };
	pointerDelta: { x: number; y: number };
	pointerTargetInteractable: boolean;
	pointerState: string;
};

const PointerDataContext = createContext<PointerDataContextProps | undefined>( undefined );

export const usePointerDataContext = () => {
	const context = useContext( PointerDataContext );
	if ( ! context ){
	  	throw new Error( "usePointerDataContext must be used within an PointerDataProvider" );
	}
	return context;
};

export function PronotronPointerDataProvider({ children }: { children: React.ReactNode })
{
	const { pointerController } = usePointerContext();

	const [ pointerPosition, setPointerPosition ] = useState({ x: 0, y: 0 });
	const [ pointerDelta, setPointerDelta ] = useState({ x: 0, y: 0 });
	const [ pointerState, setPointerState ] = useState( "" );
	const [ pointerTargetInteractable, setPointerTargetInteractable ] = useState<boolean>( false );

	useEffect(() => {

		if ( ! pointerController.current ) return;
		
		let animationFrameId = 0;

		const tick = () => {
			const pos = pointerController.current.getPosition();
			setPointerPosition({ x: pos.x, y: pos.y });
			setPointerDelta( pointerController.current.getDelta() );
			setPointerState( pointerController.current.getState() );
			setPointerTargetInteractable( pointerController.current.getTargetInteractable() );
			animationFrameId = requestAnimationFrame( tick );
		};

		animationFrameId = requestAnimationFrame( tick );

		return () => {
			cancelAnimationFrame( animationFrameId );
		};

	}, []);

	return (
		<PointerDataContext.Provider
			value={{
				pointerPosition,
				pointerDelta,
				pointerTargetInteractable,
				pointerState
			}}
		>
			{ children }
		</PointerDataContext.Provider>
	);
}