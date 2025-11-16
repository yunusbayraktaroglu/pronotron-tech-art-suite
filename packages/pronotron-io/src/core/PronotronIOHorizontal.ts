import { PronotronIOEventDispatcher } from "./PronotronIOEventDispatcher";
import { IONodeOptions } from "../../types/global";

type HorizontalEvent = "onLeftEnter" | "onLeftExit" | "onRightEnter" | "onRightExit";
export type IOHorizontalOptions = IONodeOptions<HorizontalEvent>;

/**
 * PronotronIO - A custom intersection observer solution
 * 
 * @example
 * const pronotronIO = new PronotronIOHorizontalObserver();
 * pronotronIO.setLastScroll( 0 );
 * pronotronIO.addNode({
 * 	ref: HTMLElement,
 * 	dispatch: {
 * 		onEnter: () => console.log( "Element entered from no matter" ),
 * 		onExit: () => console.log( "Element exited from no matter" ),
 * 		onInViewport: ( normalizedPosition: number ) => console.log( "Element is in viewport", normalizedPosition ),
 * 		onLeftEnter: () => console.log( "Element entered from left" ),
 * 		onLeftExit: {
 * 			dispatch: () => console.log( "Element exited from left" ),
 * 			limit: 2
 * 		},
 * 		onRightEnter...,
 * 		onRightExit...,
 * 		onFastForward: "execute_both",
 * 	},
 * 	onRemoveNode: () => element.dataset.ioActive = "0",
 * 	getBounds: () => {
 * 		const { left, right } = element.getBoundingClientRect();
 * 		const start = left + window.scrollX;
 * 		const end = right + window.scrollX;
 * 		return { start, end };
 * 	}
 * 	offset: 100, // In pixels, applied to both directions
 * });
 */
export class PronotronIOHorizontalObserver extends PronotronIOEventDispatcher<HorizontalEvent>
{
	direction: "left" | "right" = "right";

	_scrollDirectionNames = { 
		_negative: "left",
		_positive: "right" 
	};

	_eventNames = {
		_negativeEnterEvent: "onLeftEnter",
		_negativeExitEvent: "onLeftExit",
		_positiveEnterEvent: "onRightEnter",
		_positiveExitEvent: "onRightExit"
	} as const;
}