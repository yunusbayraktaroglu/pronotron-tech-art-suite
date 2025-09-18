import { PronotronIOEventDispatcher } from "./PronotronIOEventDispatcher";
import { IONodeOptions } from "../../types/global";

type VerticalEvent = "onTopEnter" | "onTopExit" | "onBottomEnter" | "onBottomExit";
export type IOVerticalOptions = IONodeOptions<VerticalEvent>;

/**
 * PronotronIO - A custom intersection observer solution
 * 
 * @example
 * const pronotronIO = new PronotronIOVerticalObserver();
 * pronotronIO.setLastScroll( 0 );
 * pronotronIO.addNode({
 * 	ref: HTMLElement,
 * 	dispatch: {
 * 		onInViewport: ( normalizedPosition: number ) => console.log( "Element is in viewport", normalizedPosition ),
 * 		onTopEnter: () => console.log( "Element entered from top" ),
 * 		onTopExit: {
 * 			dispatch: () => console.log( "Element exited from top" ),
 * 			limit: 2
 * 		},
 * 		onBottomEnter...,
 * 		onBottomExit...,
 * 		onFastForward: "execute_both",
 * 	},
 * 	onRemoveNode: () => element.dataset.ioActive = "0",
 * 	getBounds: () => {
 * 		const { top, bottom } = element.getBoundingClientRect();
 * 		const start = top + window.scrollY;
 * 		const end = bottom + window.scrollY;
 * 		return { start, end };
 * 	}
 * 	offset: 100, // In pixels, applied to both directions
 * });
 * // Recommended: wrap in a throttled handler for performance
 * window.addEventListener( 'scroll', () => pronotronIO.handleScroll( window.scrollY ) );
 */
export class PronotronIOVerticalObserver extends PronotronIOEventDispatcher<VerticalEvent>
{
	direction: "up" | "down" = "down";

	_scrollDirectionNames = { 
		_negative: "down",
		_positive: "up" 
	};

	_eventNames = {
		_negativeEnterEvent: "onTopEnter",
		_negativeExitEvent: "onTopExit",
		_positiveEnterEvent: "onBottomEnter",
		_positiveExitEvent: "onBottomExit"
	} as const;
}