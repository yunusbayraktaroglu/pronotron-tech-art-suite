"use client";

import { useEffect, createContext, useContext } from "react";
import { PronotronAnimator, PronotronClock } from "@pronotron/utils";

import { stats } from "@/components/PerformanceStats";

const clock = new PronotronClock();
export const animator = new PronotronAnimator( clock, 50 );

interface AnimatorContextProps {
	animator: PronotronAnimator;
};

const AnimatorContext = createContext<AnimatorContextProps | undefined>( undefined );

export const useAnimator = () => {
	const context = useContext( AnimatorContext );
	if ( ! context ){
	  	throw new Error( "useAnimator must be used within an PronotronAnimatorProvider" );
	}
	return context;
};

export function PronotronAnimatorProvider({ children }: { children: React.ReactNode })
{
	useEffect(() => {

		let animationFrameId = 0;

		const tick = () => {
			const deltaTime = clock.tick();
			stats.begin();
			animator.tick();
			stats.end();
			animationFrameId = requestAnimationFrame( tick );
		};

		animationFrameId = requestAnimationFrame( tick );

		const handleVisibilityChange = () => {
			if ( document.hidden ){
				clock.pause();
			} else {
				clock.resume();
			}
		};

		document.addEventListener( 'visibilitychange', handleVisibilityChange );

		return () => {
			cancelAnimationFrame( animationFrameId );
			stats.resetPanels();
			document.removeEventListener( 'visibilitychange', handleVisibilityChange );
		};
		
	}, [] );

	return (
		<AnimatorContext value={{ animator }}>
			{ children }
		</AnimatorContext>
	);
}

