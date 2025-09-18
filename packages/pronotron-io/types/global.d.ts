import type { RequireAtLeastOne } from "@pronotron/utils";

/**
 * Jumpy scroll might cause an element "fast forward", 
 * eg: first "bottom-enter" following with "top-exit" in the same loop without being visible.
 */
export type FastForwardOptions = "skip_both" | "execute_last" | "execute_both"; 

/**
 * Event dispatch options
 */
export type IODispatchFunction<TEvents extends string> = Record<TEvents, ( () => void ) | ({
	dispatch: () => void;
	limit: number;
})>;
export type IOEventsDispatch<TEvents extends string> = IODispatchFunction<TEvents> & {
	onInViewport: ( normalizedPosition: number ) => void
};
export type IODispatchOptions<TEvents extends string> = RequireAtLeastOne<IOEventsDispatch<TEvents>> & {
	/**
	 * Jumpy scroll might cause an element "fast forward", 
	 * eg: first "bottom-enter" following with "top-exit" in the same loop without being visible.
	 */
	onFastForward?: FastForwardOptions;
};

/**
 * Object that needs to pass application as member
 */
export type IONodeOptions<TEvents extends string> = {
	/**
	 * Node creation reference, to be used to avoid duplicates and respond remove requests.
	 */
	ref: PronotronIONodeRef;
	dispatch: IODispatchOptions<TEvents>;
	/**
	 * How to get IONode's absolute position (not relative to scroll value).
	 * Will be executed if the layout has been changed.
	 */
	getBounds: () => { 
		start: number;
		end: number; 
	};
	/**
	 * Will be added/deleted symetricly to both side
	 */
	offset?: number;
	onRemoveNode?: () => void;
};

/**
 * To be able to avoid duplicate nodes and respond to remove request, 
 * we need a value from client to use as KEY.
 */
export type PronotronIONodeRef = HTMLElement;

/**
 * Points the internal ID of PronotronIONode object.
 */
export type PronotronIONodeID = number;