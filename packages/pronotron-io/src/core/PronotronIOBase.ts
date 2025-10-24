import { NativeControlTable, IDPool } from "@pronotron/utils";
import { 
	PronotronIONodeRef,
	PronotronIONodeID,
	IONodeOptions,
	FastForwardOptions
} from "../../types/global";

/**
 * IONode data is stored in a flattened NativeArray.
 * This enum defines the index of each IONode property in the stride.
 */
export enum IONodeStrideIndex
{
	/**
	 * Internal ID of IONode.
	 */
	ID,
	/**
	 * Absolute start position of the IONode.
	 */
	StartPosition,
	/**
	 * Absolute end position of the IONode.
	 */
	EndPosition,
	/**
	 * 1 or 0 – Whether the node is currently inside the viewport.
	 */
	InViewport,
	/**
	 * Stores the last known position of the IONode. Points to {@link IONodePosition}
	 */
	LastPosition,
	/**
	 * 1 or 0 – Whether the node has an event handler for in-viewport.
	 */
	HasInViewportEvent,
	/**
	 * 1 or 0 – Whether the node has an event handler for entering the viewport from {@link IONodePosition.InNegativeArea}
	 */
	HasNegativeEnterEvent,
	/**
	 * 1 or 0 – Whether the node has an event handler for leaving the viewport into {@link IONodePosition.InNegativeArea}
	 */
	HasNegativeExitEvent,
	/**
	 * 1 or 0 – Whether the node has an event handler for entering the viewport from {@link IONodePosition.InPositiveArea}
	 */
	HasPositiveEnterEvent,
	/**
	 * 1 or 0 – Whether the node has an event handler for leaving the viewport into {@link IONodePosition.InPositiveArea}
	 */
	HasPositiveExitEvent,
	/**
	 * Stores the {@link FastForwardStrategy} option for this node.
	 */
	OnFastForward
};

/**
 * Calculating IONodeData size with code, causes to make it constant. 
 * The size of IONode data is fixed.
 */
const IO_NODE_DATA_SIZE = 11;

/**
 * Jumpy scroll might cause an element "fast forward", 
 * eg: first "bottom-enter" following with "top-exit" in the same loop without being visible.
 * Possible strategies for handling fast-forward cases.
 */
export enum FastForwardStrategy
{
	SkipBoth,
	ExecuteBoth,
	ExecuteLast
};

/**
 * Logical areas for positioning elements relative to the viewport.
 *
 * Vertical:
 *   NEGATIVE AREA
 *   -----------------
 *   VIEWPORT
 *   -----------------
 *   POSITIVE AREA
 *
 * Horizontal:
 *   NEGATIVE AREA | VIEWPORT | POSITIVE AREA
 */
export enum IONodePosition
{
	/**
	 * Initial position before calculating bounds.
	 */
	NotReady,
	/**
	 * Element is located in the negative area (before the viewport).
	 */
	InNegativeArea,
	/**
	 * Element is currently inside the viewport.
	 */
	InViewport,
	/**
	 * Element is located in the positive area (after the viewport).
	 */
	InPositiveArea
};

export abstract class PronotronIOBase<TEvents extends string>
{
	/**
	 * @internal
	 */
	abstract handleScroll( scrollValue: number ): void;

	/**
	 * Current scroll direction (based on the last scroll value).
	 */
	abstract direction: string;

	/**
	 * Human readable event names
	 * @internal
	 */
	abstract readonly _eventNames: {
		_negativeEnterEvent: TEvents;
		_negativeExitEvent: TEvents;
		_positiveEnterEvent: TEvents;
		_positiveExitEvent: TEvents;
	};

	/**
	 * Human readable scroll direction names
	 * @internal
	 */
	abstract readonly _scrollDirectionNames: {
		_negative: string;
		_positive: string;
	};

	/**
	 * Used to populate {@link IONodeStrideIndex.NodeID}
	 * @internal
	 */
	private _idPool: IDPool;

	/**
	 * Whether integers (rounded values) are used instead of floating-point numbers.
	 * Changes the control table data model.
	 * @internal
	 */
	private _useRounded: boolean;

	/**
	 * High frequency access interleaved typed array
	 * @internal
	 */
	protected _controlTable: NativeControlTable<IONodeStrideIndex>;

	/**
	 * Maps client-provided node references to internal node IDs.
	 * Used to prevent duplicates and allow removal by reference.
	 * @internal
	 */
	protected _nodeReferences: Map<PronotronIONodeRef, PronotronIONodeID> = new Map();
	
	/**
	 * IONode internal id to passed options
	 * @internal
	 */
	protected _nodes: Map<PronotronIONodeID, IONodeOptions<TEvents>> = new Map();

	/**
	 * Points to last applied scroll value
	 * @internal
	 */
	protected _lastScrollValue = 0;

	/**
	 * Start position of the layout
	 * @internal
	 */
	protected _viewportStart = 0;

	/**
	 * End position of the layout
	 * @internal
	 */
	protected _viewportEnd = 0;

	/**
	 * Updated once before each handleScroll loop {@link _viewportStart} + {@link _lastScrollValue}
	 * @internal
	 */
	protected _actualViewportStart = 0;

	/**
	 * Updated once before each handleScroll loop {@link _viewportEnd} + {@link _lastScrollValue}
	 * @internal
	 */
	protected _actualViewportEnd = 0;

	/**
	 * Used in onViewport() position normalization.
	 * Calculated with {@link _viewportEnd} - {@link _viewportStart}
	 * @internal
	 */
	protected _viewportSize = 0;
 
	/**
	 * Used to determine the typed array size. If greater than 65535, a 32-bit model is used.
	 * @internal
	 */
	protected _totalPageHeight = 0;

	/**
	 * @param nodeCountHint To populate fixed typed array length, will be expanded if needed
	 * @param useRounded Whether integers are used instead of floating-point numbers. Default is true.
	 */
	constructor( nodeCountHint = 20, useRounded = true )
	{
		this._useRounded = useRounded;

		/**
		 * Initially uses Uint16Array. If {@link _totalPageHeight} > 65535,
		 * the control table is converted into Uint32Array (see {@link _expandTableIfNeeded}).
		 */
		this._controlTable =  new NativeControlTable( IO_NODE_DATA_SIZE, useRounded ? Uint16Array : Float32Array, nodeCountHint );
		this._idPool = new IDPool( nodeCountHint );
	}

	/**
	 * Creates an IONode.
	 * 
	 * @param newNodeOptions IONode creation options
	 * @returns false if error, IONode internal id if success
	 */
	addNode( newNodeOptions: IONodeOptions<TEvents> ): PronotronIONodeID | false 
	{
		if ( ! this._nodeReferences.has( newNodeOptions.ref ) ){

			const internalID = this._idPool.get();

			this._nodeReferences.set( newNodeOptions.ref, internalID );
			this._nodes.set( internalID, newNodeOptions );

			const fastForwardOption = this._getFastForwardOption( newNodeOptions.dispatch.onFastForward );

			// Add all data as placeholder
			this._controlTable.add( internalID, {
				[ IONodeStrideIndex.ID ]: internalID,
				[ IONodeStrideIndex.StartPosition ]: 0,
				[ IONodeStrideIndex.EndPosition ]: 0,
				[ IONodeStrideIndex.InViewport ]: 0,
				[ IONodeStrideIndex.LastPosition ]: IONodePosition.NotReady,
				[ IONodeStrideIndex.HasInViewportEvent ]: newNodeOptions.dispatch.onInViewport ? 1 : 0,
				[ IONodeStrideIndex.HasNegativeEnterEvent ]: newNodeOptions.dispatch[ this._eventNames._negativeEnterEvent ] ? 1 : 0,
				[ IONodeStrideIndex.HasNegativeExitEvent ]: newNodeOptions.dispatch[ this._eventNames._negativeExitEvent ] ? 1 : 0,
				[ IONodeStrideIndex.HasPositiveEnterEvent ]: newNodeOptions.dispatch[ this._eventNames._positiveEnterEvent ] ? 1 : 0,
				[ IONodeStrideIndex.HasPositiveExitEvent ]: newNodeOptions.dispatch[ this._eventNames._positiveExitEvent ] ? 1 : 0,
				[ IONodeStrideIndex.OnFastForward ]: fastForwardOption
			});

			// IONode has been created successfully, consume ID
			this._idPool.consume( internalID );

			// IONode might be added while app is running. Calculate bounds
			const { nodeStart, nodeEnd } = this._updateNodeBounds( internalID, newNodeOptions );

			// If the IONode added while app is running
			if ( this._viewportSize > 0 ){
				// 1 - Position will be modified by first handleScroll
				// 2 - Position will be assigned by here
				const currentPosition = this._calculatePosition( nodeStart, nodeEnd );
				this._controlTable.modifyByID( internalID, {
					[ IONodeStrideIndex.LastPosition ]: currentPosition,
					[ IONodeStrideIndex.InViewport ]: currentPosition === IONodePosition.InViewport ? 1 : 0,
				} );
			}

			return internalID;

		} else {
			console.warn( `Node is already in the list.`, newNodeOptions.ref );
			return false;
		}
	}

	/**
	 * Removes an IONode by its ref {@link PronotronIONodeRef}
	 * 
	 * @param existingNodeRef Reference passed while executing addNode()
	 */
	removeNode( existingNodeRef: PronotronIONodeRef ): void
	{	
		const nodeID = this._nodeReferences.get( existingNodeRef );

		if ( nodeID !== undefined ){
			this._removeNodeByIds([ nodeID ]);
		} else {
			console.warn( `IONode is not found in the list.`, existingNodeRef );
		}
	}

	/**
	 * Modifies the last scroll value
	 * 
	 * @param scrollValue Scroll value
	 */
	setLastScroll( scrollValue: number ): void 
	{
		this._lastScrollValue = scrollValue;
		this._updateActualIntersection();
	}

	/**
	 * Bulk updates all IONode positions.
	 * Should be executed when the layout changes, e.g.:
	 * - Screen resize
	 * - Resizing in-page elements (accordion, etc.)
	 *
	 * @param maximumValue - Maximum possible position (e.g., `document.documentElement.scrollHeight`).
	 */
	updatePositions( maximumValue: number )
	{
		this._totalPageHeight = maximumValue;
		this._expandTableIfNeeded();

		this._nodes.forEach(( nodeSettings, nodeID ) => this._updateNodeBounds( nodeID, nodeSettings ));
	}

	/**
	 * Updates viewport layout data used in calculations.
	 * Should be called on:
	 * - Mobile viewport changes (status bar collapse/expand)
	 * - Pinch-zoom changes
	 * - Screen or in-page resizes
	 *
	 * @param start - Start position of the viewport.
	 * @param end - End position of the viewport.
	 */
	updateViewportLayout( start: number, end: number )
	{
		if ( end <= start ){
			console.warn( "Tracking area must be bigger than 0 units" );
		}

		this._viewportStart = start;
		this._viewportEnd = end;
		this._viewportSize = end - start; 

		this._updateActualIntersection();
	}

	/**
	 * Calculates current position of an IONode.
	 * 
	 * @param nodeStart IONode start position
	 * @param nodeEnd IONode end position
	 * @internal
	 */
	protected _calculatePosition( nodeStart: number, nodeEnd: number ): Exclude<IONodePosition, IONodePosition.NotReady>
	{
		if ( nodeEnd < this._actualViewportStart ){
			return IONodePosition.InNegativeArea;
		}

		if ( nodeStart > this._actualViewportEnd ){
			return IONodePosition.InPositiveArea;
		}

		return IONodePosition.InViewport;
	}

	/**
	 * Removes IONodes by their internal IDs.
	 *
	 * @param nodeIDs - Internal node IDs previously assigned.
	 * @internal
	 */
	protected _removeNodeByIds( nodeIDs: number[] ): void
	{
		for ( const nodeID of nodeIDs ){

			const nodeSettings = this._nodes.get( nodeID )!;
			
			this._nodeReferences.delete( nodeSettings.ref );
			this._nodes.delete( nodeID );
			this._controlTable.remove( nodeID );
			this._idPool.release( nodeID );

			if ( nodeSettings.onRemoveNode ){
				nodeSettings.onRemoveNode();
			}

		}
	}

	/**
	 * Updates the bounds of the node using the client-provided method.
	 *
	 * @param nodeID - Internal node ID.
	 * @param nodeSettings - Node creation options.
	 * @internal
	 */
	private _updateNodeBounds( nodeID: number, nodeSettings: IONodeOptions<TEvents> ):  { nodeStart: number, nodeEnd: number }
	{
		const { start, end } = nodeSettings.getBounds();
		const elementOffset = nodeSettings.offset || 0;
		
		const nodeStart = this._useRounded ? Math.round( start - elementOffset ) : start - elementOffset;
		const nodeEnd = this._useRounded ? Math.round( end + elementOffset ) : end + elementOffset;

		this._controlTable.modifyByID( nodeID, {
			[ IONodeStrideIndex.StartPosition ]: nodeStart,
			[ IONodeStrideIndex.EndPosition ]: nodeEnd
		} );

		return { nodeStart, nodeEnd };
	}

	/**
	 * Resolves the {@link FastForwardStrategy} from its human-readable option.
	 *
	 * @param option - Human-readable fast-forward option.
	 * @returns The corresponding {@link FastForwardStrategy}.
	 * @internal
	 */
	private _getFastForwardOption( option?: FastForwardOptions ): FastForwardStrategy
	{
		switch( option )
		{
			case "skip_both": return FastForwardStrategy.SkipBoth;
			case "execute_both": return FastForwardStrategy.ExecuteBoth;
			case "execute_last": return FastForwardStrategy.ExecuteLast;
			default: return FastForwardStrategy.SkipBoth;
		}
	}

	/**
	 * Precomputes the actual viewport bounds before each scroll loop
	 * for performance reasons.
	 *
	 * @internal
	 */
	protected _updateActualIntersection()
	{
		this._actualViewportStart = this._viewportStart + this._lastScrollValue;  
		this._actualViewportEnd = this._viewportEnd + this._lastScrollValue;  
	}

	/**
	 * Expands {@link _controlTable} to Uint32Array
	 * if using unsigned integers and 16-bit capacity is exceeded.
	 *
	 * @internal
	 */
	private _expandTableIfNeeded(): void
	{
		if ( this._useRounded && this._totalPageHeight > 65535 && this._controlTable.table.constructor !== Uint32Array ){
			const newControlTable = Uint32Array.from( this._controlTable.table );
			this._controlTable.table = newControlTable;
		}
	}

}