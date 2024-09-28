/**
 * Utils
 */
type RequireAtLeastOne<T> = {
	[K in keyof T]: Pick<T, K> & Partial<T>;
  }[keyof T];

type RequireExactlyOne<T> = {
    [K in keyof T]: { [P in K]: T[P] } & Partial<Record<Exclude<keyof T, K>, never>>;
}[keyof T];

/**
 * Possible events of an element
 */
export type IOEvent = "top-in" | "top-out" | "bottom-in" | "bottom-out";
export type IODispatchFunction = Record<IOEvent, () => void>;

/**
 * Options to passed
 */
export type IODispatchOptions = RequireAtLeastOne<IODispatchFunction>;
export type IODispatchOptionsWithRetry = RequireExactlyOne<IODispatchFunction> & { 
	/** With retry, only 1 kind of event can be defined */
	retry: number 
};

/**
 * Object that needs to pass application as member
 */
export type IONodeOptions = {
	ref: Element;
	dispatch: IODispatchOptions | IODispatchOptionsWithRetry;
	/**
	 * How to get element initial Y position. (Not relative to scroll value)
	 */
	getYPosition: () => number;
};

/**
 * Generated PronotronIONode.id
 */
export type PronotronNodeRef = Element;
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