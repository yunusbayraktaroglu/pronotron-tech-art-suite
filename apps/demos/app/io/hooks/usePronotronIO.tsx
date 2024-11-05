"use client";

import { useEffect, useRef } from 'react';
import { IODispatchOptions, IODispatchOptionsWithRetry } from '@pronotron/io';
import { usePronotronIOContext } from "./PronotronIOProvider";

interface usePronotronIOProps {
	dispatch: IODispatchOptions | IODispatchOptionsWithRetry;
};

export function usePronotronIO({ dispatch }: usePronotronIOProps )
{
	const io = usePronotronIOContext( context => context.io );
	const ref = useRef<HTMLElement>( null ! );

	useEffect(() => {

		const element = ref.current;
		element.dataset.ioActive = "1";

		const nodeID = io.addNode({
			ref: element,
			dispatch: dispatch,
			onRemoveNode: () => element.dataset.ioActive = "0",
			getYPosition: () => element.getBoundingClientRect().top + window.scrollY,
		});
		
		return () => {
			/**
			 * A node may be manually removed, check if still active
			 */
			if ( nodeID && element.dataset.ioActive === "1" ){
				io.removeNode( element );
			}
		};

	}, []);

	return { ref };
}