"use client";

import { useEffect, useRef } from 'react';
import { IONodeOptions } from '@pronotron/io';
import { usePronotronIOContext } from "./PronotronIOProvider";

type PronotronIODispatcherProps = React.ComponentProps<"div"> & Omit<IONodeOptions, "ref" | "getBounds">;

export function IODispatcher({ dispatch, offset, onRemoveNode, ...divProps }: PronotronIODispatcherProps)
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
			onRemoveNode,
			getBounds: () => {
				const { top, bottom } = element.getBoundingClientRect();
				return { 
					start: top + window.scrollY, 
					end: bottom + window.scrollY 
				};
			},
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