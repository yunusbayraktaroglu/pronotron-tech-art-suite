import { useEffect, useState, useRef } from 'react';
import { PronotronClock } from '@pronotron/utils';

export function usePronotronAppClock()
{
	const clock = useRef( new PronotronClock() );

	const [ elapsedTime, setElapsedTime ] = useState( 0 );
	const [ activeElapsedTime, setActiveElapsedTime ] = useState( 0 );

	useEffect(() => {

		const tick = () => {
			clock.current.tick();
			setElapsedTime( clock.current.elapsedTime );
			setActiveElapsedTime( clock.current.elapsedPausedTime );
			requestAnimationFrame( tick );
		};

		const animationFrameId = requestAnimationFrame( tick );

		const handleVisibilityChange = () => {
			if ( document.hidden ){
				clock.current.pause();
			} else {
				clock.current.continue();
			}
		};

		document.addEventListener( 'visibilitychange', handleVisibilityChange );

		return () => {
			cancelAnimationFrame( animationFrameId );
			document.removeEventListener( 'visibilitychange', handleVisibilityChange );
		};
		
	}, []);

	return { elapsedTime, activeElapsedTime };
};