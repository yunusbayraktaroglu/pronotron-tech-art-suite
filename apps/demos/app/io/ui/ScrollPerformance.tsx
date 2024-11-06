import { useEffect, useState } from "react";
import { PronotronClock } from "@pronotron/utils";

const clock = new PronotronClock();

export function FPSTracker()
{
	const [ fps, setFps ] = useState( 0 );

	useEffect(() => {

		const tick = () => {
			const deltaTime = clock.tick();
			setFps( Math.round( 1.0 / deltaTime ) );
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