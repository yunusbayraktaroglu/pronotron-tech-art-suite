import { useEffect, useState } from "react";
import { PronotronClock } from "@pronotron/utils";
import throttle from "lodash.throttle";

import Stats from "@/app/components/stats";

const clock = new PronotronClock();

export function FPSTracker()
{
	const [ fps, setFps ] = useState( 0 );

	useEffect(() => {

		const stats = new Stats();
		stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
		stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
		document.body.appendChild( stats.dom );

		const updateFps = ( deltaTime: number ) => setFps( Math.round( 1.0 / deltaTime ) );
		const throttleFps = throttle( updateFps, 500, { leading: false, trailing: true } );

		const tick = () => {
			stats.begin();
			// monitored code goes here
			stats.end();

			//const deltaTime = clock.tick();
			//throttleFps( deltaTime );
			requestAnimationFrame( tick );
		};

		const animationFrameId = requestAnimationFrame( tick );

		const handleVisibilityChange = () => {
			if ( document.hidden ){
				clock.pause();
			} else {
				clock.continue();
			}
		};

		document.addEventListener( 'visibilitychange', handleVisibilityChange );

		return () => {
			cancelAnimationFrame( animationFrameId );
			document.removeEventListener( 'visibilitychange', handleVisibilityChange );
		};
		
	}, []);

	return fps;
}