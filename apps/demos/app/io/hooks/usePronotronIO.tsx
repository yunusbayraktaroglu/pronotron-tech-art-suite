"use client";

import { useEffect, useRef } from 'react';
import { IODispatchOptions, IONodeOptions } from '@pronotron/io';
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
			getBounds: () => {
				const { top, bottom } = element.getBoundingClientRect();
				return { 
					start: top + window.scrollY, 
					end: bottom + window.scrollY 
				};
			},
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


type PronotronIODispatcherProps = React.ComponentProps<"div"> & Omit<IONodeOptions, "ref" | "getBounds" | "onRemoveNode">;


export function IODispatcher({ dispatch, offset, ...divProps }: PronotronIODispatcherProps)
{
	const divRef = useRef<HTMLDivElement>( null ! );
	const io = usePronotronIOContext( context => context.io );

	useEffect(() => {

		if ( ! divRef.current ) return;

		const element = divRef.current;

		const IONodeID = io.addNode({
			ref: element,
			dispatch,
			offset,
			getBounds: () => {
				const { top, bottom } = element.getBoundingClientRect();
				return { 
					start: top + window.scrollY, 
					end: bottom + window.scrollY 
				};
			},
			onRemoveNode: () => console.log( "node removed" ),
		});
		
		return () => {
			if ( IONodeID !== false ){
				io.removeNode( element );
			}
		};

	}, []);

	return (
		<div ref={ divRef } { ...divProps } data-io="1" />
	)
}