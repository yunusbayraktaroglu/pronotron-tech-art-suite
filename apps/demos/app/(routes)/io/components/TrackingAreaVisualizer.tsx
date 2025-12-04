"use client";

import { useEffect, useState } from "react";

/**
 * Shows the actual viewport tracked by PronotronIO program
 */
export function TrackingAreaVisualizer()
{
	const [ trackingArea, setTrackingArea ] = useState({ bottom: 0, top: 0, zoom: 0 });

	const getViewport = () => {
		if ( window.visualViewport ){
			return {
				height: window.visualViewport.height,
				offsetTop: window.visualViewport.offsetTop,
				scale: window.visualViewport.scale,
			};
		}
		return {
			height: window.innerHeight,
			offsetTop: 0,
			scale: 1,
		};
	};

	useEffect(() => {
		let animationFrameId = 0;
		const tick = () => {
			const vp = getViewport();
			// Same method used by the IO program
			setTrackingArea({
				bottom: window.scrollY + vp.offsetTop,
				top: window.scrollY + vp.height + vp.offsetTop,
				zoom: vp.scale,
			});
			animationFrameId = requestAnimationFrame( tick );
		};
		animationFrameId = requestAnimationFrame( tick );

		return () => {
			cancelAnimationFrame( animationFrameId );
		}
	}, []);

	return (
		<div className="z-[9999]">
			<span className="absolute w-[100px] h-[5px] top-0 right-0 bg-blue-500 rounded-l-md" style={{ translate: `0 ${ Math.round( trackingArea.bottom ) }px` }}>
				<p className='text-xs ml-3 leading-none mt-1'>{ Math.round( trackingArea.bottom ) }</p>
			</span>
			<span className="absolute w-[100px] h-[5px] top-0 right-0 bg-blue-800 rounded-l-md" style={{ translate: `0 ${ Math.round( trackingArea.top - 5 ) }px` }}>
				<p className='text-xs ml-3 leading-none -mt-2'>{ Math.round( trackingArea.top ) }</p>
			</span>
		</div>
	)
}