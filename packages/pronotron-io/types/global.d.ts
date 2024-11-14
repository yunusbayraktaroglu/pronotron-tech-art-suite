/**
 * Utils
 */
type RequireAtLeastOne<T> = {
	[ K in keyof T ]: Pick<T, K> & Partial<T>;
}[ keyof T ];

type RequireExactlyOne<T> = {
	[ K in keyof T ]: { [ P in K ]: T[ P ] } & Partial<Record<Exclude<keyof T, K>, never>>;
}[ keyof T ];

export type BinaryBoolean = 1 | 0;

/**
 * Possible events of an element
 */
export type IOVerticalEvent = "onTopIn" | "onTopOut" | "onBottomIn" | "onBottomOut";
export type IOHorizontalEvent = "onLeftIn" | "onLeftOut" | "onRightIn" | "onRightOut";

/**
 * Jumpy scroll values might cause an element "fast forward", 
 * eg: first "bottom-in" following with "top-out" in the same loop.
 */
export type FastForwardOptions = "skip_both" | "execute_both" | "execute_last"; 

/**
 * One time events
 */
export type IODispatchFunction = Record<IOVerticalEvent, ( () => void ) | ({
	dispatch: () => void;
	limit: number;
})>;

export type IOEventsDispatch = IODispatchFunction & {
	onInViewport: ( normalizedPosition: number ) => void
};

/**
 * Options to passed
 */
export type IODispatchOptions = RequireAtLeastOne<IOEventsDispatch> & {
	/**
	 * Jumpy scroll values might cause an element "fast forward", 
	 * eg: first "bottom-in" following with "top-out" in the same loop.
	 */
	onFastForward?: FastForwardOptions;
};

/**
 * Object that needs to pass application as member
 */
export type IONodeOptions = {
	/**
	 * Node creation reference, to be used to avoid duplicates and respond remove requests.
	 */
	ref: Element;
	dispatch: IODispatchOptions;
	/**
	 * How to get element initial position. (Not relative to scroll value)
	 * Will be executed for each node if viewport has been changed
	 * Start & end values can be same for lines.
	 */
	getBounds: () => { 
		start: number;
		end: number; 
	};
	offset?: number;
	onRemoveNode?: () => void;
};

/**
 * To be able to avoid duplicate nodes and respond to remove request, 
 * we need a value from client to use as KEY.
 */
export type PronotronNodeRef = Element;

/**
 * Points the id of PronotronIONode object.
 * Each add node request from client, generates a PronotronIONode object.
 */
export type PronotronNodeID = number;