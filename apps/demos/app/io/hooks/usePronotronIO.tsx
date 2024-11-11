"use client";

import { useEffect, useRef } from 'react';
import { IODispatchOptions } from '@pronotron/io';
import { usePronotronIOContext } from "./PronotronIOProvider";

interface usePronotronIOProps {
	dispatch: IODispatchOptions;
	offset?: number;
};

export function usePronotronIO({ dispatch, offset }: usePronotronIOProps )
{
	const io = usePronotronIOContext( context => context.io );
	const ref = useRef<HTMLElement>( null ! );

	useEffect(() => {

		const element = ref.current;
		element.dataset.ioActive = "1";

		const nodeID = io.addNode({
			ref: element,
			dispatch: dispatch,
			offset,
			onRemoveNode: () => element.dataset.ioActive = "0",
			getYPosition: () => element.getBoundingClientRect().top + window.scrollY,
		});
		
		return () => {
			/**
			 * A node may be manually removed if using 'retry' option, 
			 * check if still active before removal.
			 * nodeID might be zero.
			 */
			if ( nodeID !== false && element.dataset.ioActive === "1" ){
				console.log( "remove node");
				io.removeNode( element );
			}
		};

	}, []);

	return { ref };
}