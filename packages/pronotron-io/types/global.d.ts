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
export type IOVerticalEvent = "top-in" | "top-out" | "bottom-in" | "bottom-out";
export type IOHorizontalEvent = "left-in" | "left-out" | "right-in" | "right-out";
export type IODispatchFunction = Record<IOVerticalEvent, () => void | {
	dispatch: () => void;
	retry: number;
}>;

export type IODispatchFunction2 = {
	visible: ( normalizedPosition: number ) => void;
} & IODispatchFunction;

/**
 * Options to passed
 */
export type IODispatchOptions = RequireAtLeastOne<IODispatchFunction2>;
export type IODispatchOptionsWithRetry = RequireExactlyOne<IODispatchFunction2> & { 
	/** With retry, only 1 kind of event can be defined */
	retry: number;
};

/**
 * Object that needs to pass application as member
 */
export type IONodeOptions = {
	/**
	 * Node creation reference, to be used to avoid duplicates and respond remove requests.
	 */
	ref: Element;
	dispatch: IODispatchOptions | IODispatchOptionsWithRetry;
	offset?: number;
	onRemoveNode?: () => void;
	/**
	 * How to get element initial Y position. (Not relative to scroll value)
	 */
	getYPosition: () => number;
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

/**
 * Viewport Props should be passed from parent application, since scroll logic might be different
 */
export type ViewportProps = {
	/**
	 * Visible screen height
	 */
	screenHeight: number;
	/**
	 * Total page height including unvisible area to calculate total scroll value
	 */
	totalPageHeight: number;
};