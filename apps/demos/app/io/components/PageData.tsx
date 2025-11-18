"use client";

import { useEffect, useState } from "react";
import { Expandable } from "@/app/components/Expandable";
import { usePronotronIOContext } from "../hooks/PronotronIOProvider";

/**
 * A debug component that displays real-time scroll and viewport metrics 
 * monitoring the environment data that feeds the PronotronIO library.
 */
export function PageData()
{
	const PronotronIO = usePronotronIOContext( context => context.io );
	const [ pageData, setPageData ] = useState({
		scrollY: 0,
		visibleViewport: 0,
		viewport: 0,
		totalScroll: 0,
		direction: "down"
	});

	useEffect(() => {

		let animationFrameId = 0;
		
		const tick = () => {
			setPageData({
				scrollY: window.scrollY,
				visibleViewport: window.visualViewport?.height || window.innerHeight,
				viewport: window.innerHeight,
				totalScroll: document.documentElement.scrollHeight,
				direction: PronotronIO.direction
			})
			animationFrameId = requestAnimationFrame( tick );
		};

		animationFrameId = requestAnimationFrame( tick );

		return () => {
			cancelAnimationFrame( animationFrameId );
		};

	}, []);

	return (
		<Expandable title="Page Debug" expand={ true }>
			<div className="mt-spacing-xs container flex flex-row items-center justify-between gap-spacing-sm text-xs text-center">
				<span>VisibleViewport: <br/>{ Math.round( pageData.visibleViewport ) }</span>
				<span>Viewport: <br/>{ Math.round( pageData.viewport ) }</span>
				<span>TotalScroll: <br/>{ Math.round( pageData.totalScroll ) }</span>
				<span>Direction: <br/>{ pageData.direction }</span>
				{/* <span>Zoom: <br/>{ trackingArea.zoom.toFixed(2) }</span> */}
				<span>ScrollY: <br/>{ Math.round( pageData.scrollY ) }</span>
			</div>
		</Expandable>
	)
}