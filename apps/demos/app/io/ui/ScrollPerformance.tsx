import { useEffect, useState } from "react";

let lastScrollTime = performance.now();
let frameCount = 0;
let scrollFPS = 0;
let lastUpdate = performance.now();

export function ScrollPerformanceUI()
{
	const [ fps, setFps ] = useState( 0 );

	useEffect(() => {

		const updateScrollFPS = () => {
			const currentTime = performance.now();
			frameCount++;
			const delta = currentTime - lastScrollTime;
		
			// Update FPS every second or when user stops scrolling
			if ( currentTime - lastUpdate >= 1000 ) {
				scrollFPS = ( frameCount / ( currentTime - lastUpdate ) ) * 1000;
				setFps( scrollFPS );
				frameCount = 0;
				lastUpdate = currentTime;
			}
			
			lastScrollTime = currentTime;
		}
		// Event listener for scroll
		window.addEventListener( 'scroll', updateScrollFPS );

		return () => {
			window.removeEventListener( 'scroll', updateScrollFPS );
		}
	}, []);

	return (
		<div className="fixed right-0 top-0 bg-green-500 p-3">
			<p>Scroll FPS: { fps }</p>
		</div>
	)
}