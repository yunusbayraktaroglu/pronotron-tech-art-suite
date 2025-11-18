"use client";

import { useEffect, useRef, useState } from 'react';
import { IOVerticalOptions } from '@pronotron/io';
import { usePronotronIOContext } from "../hooks/PronotronIOProvider";

/**
 * Defines the properties for the IODispatcher components.
 */
type PronotronIODispatcherProps = React.ComponentProps<"div"> & Omit<IOVerticalOptions, "ref" | "getBounds">;

/**
 * The core Scroll/Viewport Event Observer Node. This component wraps any content
 * and registers its containing <div> element with the global PronotronIO scroll
 * observation system.
 */
export function IODispatcher({ dispatch, offset, onRemoveNode, ...divProps }: PronotronIODispatcherProps)
{
	const divRef = useRef<HTMLDivElement>( null ! );
	const io = usePronotronIOContext( context => context.io );

	useEffect(() => {

		const element = divRef.current;

		const IONodeID = io.addNode({
			ref: element,
			dispatch,
			offset,
			onRemoveNode,
			getBounds: () => {

				const { top, bottom } = element.getBoundingClientRect();
				
				const start = top + window.scrollY;
				const end = bottom + window.scrollY;

				return { start, end };
			},
		});
		
		return () => {
			if ( IONodeID !== false ){
				io.removeNode( element );
			}
		};

	}, []);

	return <div ref={ divRef } { ...divProps } data-io="1"></div>
}

/**
 * An enhanced, visual debugging utility for the IODispatcher. It performs the same scroll observation registration as IODispatcher 
 * but adds visual markers (red circles and coordinates) to the page to show the exact absolute 
 * scroll positions (top and bottom) that the observer is tracking.
 */
export function IODispatcherDebug({ dispatch, offset, onRemoveNode, ...divProps }: PronotronIODispatcherProps)
{
	const divRef = useRef<HTMLDivElement>( null ! );
	const io = usePronotronIOContext( context => context.io );
	const [ bounds, setBounds ] = useState({ top: 0, bottom: 0 });

	useEffect(() => {

		const element = divRef.current;

		const IONodeID = io.addNode({
			ref: element,
			dispatch,
			offset,
			onRemoveNode,
			getBounds: () => {

				const { top, bottom } = element.getBoundingClientRect();
				
				const start = top + window.scrollY;
				const end = bottom + window.scrollY;

				// To visually debug top and bottom positions
				setBounds({ top: start, bottom: end });

				return { start, end };
			},
		});
		
		return () => {
			if ( IONodeID !== false ){
				io.removeNode( element );
			}
		};

	}, []);

	const topClass = `absolute w-[10px] h-[10px] bg-red-500 rounded-full`;

	return (
		<>
			<div ref={ divRef } { ...divProps } data-io="1"></div>
			<span className={ topClass } style={{ top: `${ Math.round( bounds.top - 5 ) }px` }}>
				<p className='text-xs leading-none ml-[12px]'>{ Math.round( bounds.top ) }</p>
			</span>
			<span className={ topClass } style={{ top: `${ Math.round( bounds.bottom - 5 ) }px` }}>
				<p className='text-xs leading-none ml-[12px]'>{ Math.round( bounds.bottom ) }</p>
			</span>
		</>
	)
}