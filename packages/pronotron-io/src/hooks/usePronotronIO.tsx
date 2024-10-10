"use client";

import { useEffect, useRef } from 'react';
import { PronotronIOController } from '../core/PronotronIOController';
import { IODispatchOptions, IODispatchOptionsWithRetry } from '../../types/global';

interface usePronotronIOProps {
	dispatch: IODispatchOptions | IODispatchOptionsWithRetry;
};

export function usePronotronIO({ dispatch }: usePronotronIOProps )
{
	const ref = useRef<HTMLElement>( null ! );

	useEffect(() => {

		const element = ref.current;
		const controller = PronotronIOController.getInstance();

		element.dataset.deactive = "0";

		const nodeID = controller.addNode({
			ref: element,
			dispatch: dispatch,
			onRemoveNode: () => element.dataset.deactive = "1",
			getYPosition: () => element.getBoundingClientRect().top + window.scrollY,
		});
		
		return () => {
			/**
			 * A node may be manually removed, check if still active
			 */
			if ( nodeID && element.dataset.deactive === "0" ){
				controller.removeNode( element );
				//controller._removeNodeByIds([ nodeID ]);
			}
		};

	}, []);

	return { ref };
}