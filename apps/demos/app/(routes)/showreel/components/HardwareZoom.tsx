"use client";

import './Hardwarezoom.css';

import { useState, useRef } from "react";
import { IODispatcher } from "../../io/components/IODispatcher";

export function HardwareZoom()
{
	const [ zoom, setZoom ] = useState( 0 );
	const videoRef = useRef<HTMLVideoElement>( null );

	return (
		<div className="min-h-[200vh] relative bg-black">

			{/* Text part */}
			<div className="absolute text-white w-full mt-[50vh] z-50" style={ { opacity: Math.max( 0, 1 - ( zoom * 5 ) ) } }>
				<div className="container landscape:max-w-[50%] font-sans text-center">
					<h3 className="text-xl">Pro video</h3>
					<h4 className="text-3xl landscape:text-5xl font-bold">Any more pro and it would need an agent.</h4>
				</div>
			</div>

			{/* Sticky part, half of the scroll container, will be sticky for 1 screen height */}
			<div className="sticky-container h-screen">

				<div className="container flex">
					<div className="responsive-container portrait:rotate-90 portrait:scale-180" style={ { transform: `matrix( ${ 2.0 - zoom }, 0, 0, ${ 2.0 - zoom }, 0, 0)` } }>

						<div className="screen-container">
							<video
								ref={ videoRef }
								className="w-full"
								aria-label="A rugby game demonstrates the video recording capabilities of iPhone 17 Pro" 
								role="img"
								loop
								muted 
								playsInline 
								src="./large.mp4"
							/>
						</div>
						
						<picture className="w-full h-full absolute hardware-image pointer-events-none">
							<source srcSet="video_hw__blfqisph35yu_small.png, video_hw__blfqisph35yu_small_2x.png 2x" media="(max-width:734px)" />
							<source srcSet="video_hw__blfqisph35yu_medium.png, video_hw__blfqisph35yu_medium_2x.png 2x" media="(max-width:1068px)" />
							<source srcSet="video_hw__blfqisph35yu_large.png, video_hw__blfqisph35yu_large_2x.png 2x" media="(min-width:0px)" />
							<img src="video_hw__blfqisph35yu_large.png" className="w-full" />
						</picture>

					</div>
				</div>

			</div>

			<IODispatcher 
				key="IO_CONTROLLER"
				className="w-full h-screen"
				dispatch={ {
					onScrollProgress: ( scrollProgress ) => setZoom( scrollProgress ),
					onEnter: () => videoRef.current?.play(),
					onExit: () => videoRef.current?.pause(),
					/**
					 * Zoom will be last onScrollProgress value, might be something like (0.9995..., 0.0112...)
					 * Guarantee the reset value
					 * 
					 * @todo
					 * Direction agnostic events must have dispatched after other events
					 */
					onTopExit: () => setZoom( 1.0 ),
					onBottomExit: () => setZoom( 0.0 ),
					// Execute exit events on fast-forward
					onFastForward: "execute_last"
				} }
			/>
		</div>
	)		
}