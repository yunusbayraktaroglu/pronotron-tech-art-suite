"use client";

import { useEffect, useRef, useState } from 'react';
import { PronotronIOController } from '../core/PronotronIOController';
import { IODispatchOptions, IODispatchOptionsWithRetry } from '../../types/global';

export type { IODispatchOptions, IODispatchOptionsWithRetry }

interface usePronotronIOProps {
	dispatch: IODispatchOptions | IODispatchOptionsWithRetry;
};

export function usePronotronIO({ dispatch }: usePronotronIOProps )
{
	const ref = useRef<HTMLElement>( null ! );
	const [ isActive, setIsActive ] = useState( true );
	
	useEffect(() => {
		if ( isActive ){
			const element = ref.current;
			const controller = PronotronIOController.getInstance();
	
			const nodeID = controller.addNode({
				ref: element,
				dispatch: dispatch,
				onRemoveNode: () => setIsActive( false ),
				getYPosition: () => element.getBoundingClientRect().top + window.scrollY,
			});
			
			return () => {
				console.log( "unmount")
				controller.removeNode( element );
				// Reset `isActive` to true when unmounting
				// setIsActive( true ); 
			};
		}

		return () => null;
		
	}, [ isActive ]);

	return { ref, isActive };
}