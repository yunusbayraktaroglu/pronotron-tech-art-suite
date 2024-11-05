"use client";

import { useEffect, useRef } from 'react';
import { PronotronIOVertical } from '../core/PronotronIOVertical';
import { IODispatchOptions, IODispatchOptionsWithRetry } from '../../types/global';

interface usePronotronIOProps {
	IO: PronotronIOVertical;
	dispatch: IODispatchOptions | IODispatchOptionsWithRetry;
};

export function usePronotronIO2({ IO, dispatch }: usePronotronIOProps )
{
	const ref = useRef<HTMLElement>( null ! );

	useEffect(() => {

		const element = ref.current;
		element.dataset.ioActive = "1";

		const nodeID = IO.addNode({
			ref: element,
			dispatch: dispatch,
			onRemoveNode: () => element.dataset.ioActive = "0",
			getYPosition: () => element.getBoundingClientRect().top + window.scrollY,
		});
		
		return () => {
			/**
			 * A node may be manually deactivated/removed, check if still active
			 */
			if ( nodeID && element.dataset.ioActive === "1" ){
				IO.removeNode( element );
			}
		};

	}, []);

	return { ref };
}