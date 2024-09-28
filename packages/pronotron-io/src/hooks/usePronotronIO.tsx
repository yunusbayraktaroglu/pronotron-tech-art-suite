"use client";

import { useEffect, useRef } from 'react';
import { PronotronIOController } from '../core/PronotronIOController';
import { IODispatchOptions, IODispatchOptionsWithRetry } from '../../types/global';

export type { IODispatchOptions, IODispatchOptionsWithRetry }

interface useInViewportProps {
	dispatch: IODispatchOptions | IODispatchOptionsWithRetry;
};

export function usePronotronIO({ dispatch }: useInViewportProps )
{
	const ref = useRef<HTMLElement>( null ! );

	useEffect(() => {

		if ( ref.current ){

			const controller = PronotronIOController.getInstance();

			const nodeID = controller.addNode({
				ref: ref.current,
				dispatch: dispatch,
				getYPosition: () => ref.current.getBoundingClientRect().top + window.scrollY,
			});
			
			return () => {
				controller.removeNode( ref.current );
			};

		}

		return () => null;

	}, []);

	return { ref };
}