import type { RequireAtLeastOne } from "@pronotron/utils";

/**
 * Handles scenarios where rapid, "jumpy" scrolling causes the element to bypass
 * intermediate scroll boundaries (e.g., transitioning instantly from 'bottom-exit' to 'top-enter'
 * without triggering 'top-exit').
 */
export type FastForwardOptions = "skip_both" | "execute_last" | "execute_both";

/**
 * Core, direction-agnostic events for an element's visibility state.
 * Other specific events (like 'onTopEnter', 'onLeftExit') are passed via TEvents.
 * {@link PronotronIOHorizontal}, {@link PronotronIOVertical}
 */
export type GlobalBasicEvents = "onEnter" | "onExit";

/**
 * Defines the structure for event handlers that are executed during scroll monitoring.
 * Handlers can be simple functions or objects allowing for execution limits.
 *
 * @example
 * const dispatchFunc = {
 * 	onTopExit: () => console.log( 'Top boundary crossed!' ),
 * 	onTopEnter: {
 * 		dispatch: () => console.log( 'Top enter limited to 3 times' ),
 * 		limit: 3
 * 	}
 * };
 */
export type IODispatchFunction<TEvents extends string> = Record<TEvents | GlobalBasicEvents, ( () => void ) | ({
	/**
     * The callback function to be executed when the event boundary is crossed.
     */
	dispatch: () => void;
	/**
     * The maximum number of times this event handler is allowed to execute.
     */
	limit: number;
})>;

export type IOEventsDispatch<TEvents extends string> = IODispatchFunction<TEvents> & {
    /**
     * Tracks read/view completion progress within the viewport.
     * 0% = Element top hits viewport bottom.
     * 100% = Element bottom hits viewport bottom (fully visible).
	 * 
     * @param scrollProgress Element visibility percentage (0 to 1).
     */
	onScrollProgress: ( scrollProgress: number ) => void;
    /**
     * Element moves within the viewport.
     * @param normalizedPosition Normalized value from [-1, +1].
     */
	onInViewport: ( normalizedPosition: number ) => void;
};

export type IODispatchOptions<TEvents extends string> = RequireAtLeastOne<IOEventsDispatch<TEvents>> & {
    /**
     * Defines how to handle rapid scroll (fast-forward) events.
     */
	onFastForward?: FastForwardOptions;
};

/**
 * Configuration options required to register a new element for scroll/viewport monitoring.
 */
export type IONodeOptions<TEvents extends string> = {
    /**
     * A unique reference object (e.g., the HTMLElement itself) used as a key
     * for tracking the node and responding to remove requests.
     */
	ref: PronotronIONodeRef;
    /**
     * Event handlers and execution options to be monitored.
     */
	dispatch: IODispatchOptions<TEvents>;
    /**
     * Function that returns the element's absolute boundaries (start/end) relative to the document.
     * This is executed when the layout changes (e.g., window resize).
     */
	getBounds: () => { 
		start: number;
		end: number; 
	};
    /**
     * An optional symmetrical padding (in pixels) added to both the top and bottom 
     * of the element's boundary box for triggering events earlier/later.
     */
	offset?: number;
	/**
     * Callback executed when the node is successfully removed from monitoring.
     */
	onRemoveNode?: () => void;
};

/**
 * The client-provided reference (e.g., an HTMLElement) used as a unique key 
 * to identify the node within the monitoring system.
 */
export type PronotronIONodeRef = HTMLElement;

/**
 * The internal ID assigned by the scroll monitoring system to a PronotronIONode object.
 */
export type PronotronIONodeID = number;