import { NativeControlTable, IDPool } from "@pronotron/utils";
import { 
	PronotronNodeRef,
	IONodeOptions,
	PronotronNodeID,
	FastForwardOptions
} from "../../types/global";

export enum IONodeData {
	TrackTopIn,
	TrackTopOut,
	TrackBottomIn,
	TrackBottomOut,
	InViewport,
	NodeStart,
	NodeEnd,
	NodeID,
	OnViewportEvent,
	OnTopInEvent,
	OnTopOutEvent,
	OnBottomInEvent,
	OnBottomOutEvent,
	OnFastForward
};
const nodeDataSize = 14;

export enum FastForwardData {
	SkipBoth,
	ExecuteBoth,
	ExecuteLast
};

export abstract class PronotronIOBase
{
	/** @internal */
	abstract handleScroll( scrollY: number ): void;

	/**
	 * We need to get a value from client to use as KEY, 
	 * to avoid duplicate and to be able to respond remove requests.
	 * @internal
	 */
	protected _nodeReferences: Map<PronotronNodeRef, PronotronNodeID> = new Map();
	
	/**
	 * PronotronIO node object with id's.
	 * @internal
	 */
	protected _nodes: Map<PronotronNodeID, IONodeOptions> = new Map();

	/** @internal */
	protected _lastScrollY = 0;

	/** @internal */
	protected _viewport: undefined | {
		_screenHeight: number,
		_totalPageHeight: number,
		_totalPossibleScroll: number, // _totalPageHeight - _screenHeight
	};

	/**
	 * High frequency access interleaved typed array
	 * Uint16: 0 to 65535 for long scroll values
	 * Uint32: 0 to 4294967295 for very long scroll values
	 * @internal
	 */
	protected _controlTable: NativeControlTable<typeof IONodeData>;

	/** @internal */
	private _idPool: IDPool;

	/** @internal */
	private _useRounded: boolean;

	/**
	 * @param nodeCountHint To populate fixed typed array length, will be expanded if needed
	 * @param useRounded Uses integers instead of floating numbers, changes table data model
	 */
	constructor( nodeCountHint = 20, useRounded = true )
	{
		this._useRounded = useRounded;

		/**
		 * Start with Uint16Array, if totalPageHeight > 65535, it will be converted into Uint32Array below
		 */
		this._controlTable =  new NativeControlTable( nodeDataSize, useRounded ? Uint16Array : Float32Array, nodeCountHint );
		this._idPool = new IDPool( nodeCountHint );
	}

	/**
	 * Creates a tracking node.
	 * 
	 * @param nodeOptions IO node creation options
	 * @returns false if error, node instance id if success
	 */
	addNode( newNodeOptions: IONodeOptions ): false | PronotronNodeID
	{
		if ( ! this._nodeReferences.has( newNodeOptions.ref ) ){

			const internalID = this._idPool.getID();

			/**
			 * In interleaved controlTable array we could only know PronotronIONode.id
			 * 
			 * - Use _nodeReferences as avoid duplicate and removal only
			 * - Use _nodes to find passed nodeData
			 */
			this._nodeReferences.set( newNodeOptions.ref, internalID );
			this._nodes.set( internalID, newNodeOptions );

			const fastForwardOption = this._getFastForwardOption( newNodeOptions.dispatch.onFastForward );

			// Add all properties as placeholder
			this._controlTable.addSlot( internalID, {
				[ IONodeData.NodeID ]: internalID,
				[ IONodeData.NodeStart ]: 0,
				[ IONodeData.NodeEnd ]: 0,
				[ IONodeData.TrackTopIn ]: 0,
				[ IONodeData.TrackTopOut ]: 0,
				[ IONodeData.TrackBottomIn ]: 0,
				[ IONodeData.TrackBottomOut ]: 0,
				[ IONodeData.InViewport ]: 0,
				[ IONodeData.OnViewportEvent ]: newNodeOptions.dispatch.onInViewport ? 1 : 0,
				[ IONodeData.OnTopInEvent ]: newNodeOptions.dispatch.onTopIn ? 1 : 0,
				[ IONodeData.OnTopOutEvent ]: newNodeOptions.dispatch.onTopOut ? 1 : 0,
				[ IONodeData.OnBottomInEvent ]: newNodeOptions.dispatch.onBottomIn ? 1 : 0,
				[ IONodeData.OnBottomOutEvent ]: newNodeOptions.dispatch.onBottomOut ? 1 : 0,
				[ IONodeData.OnFastForward ]: fastForwardOption
			});

			// Element might be added while app is running. Calculate bounds
			this._setElementBounds( internalID, newNodeOptions );

			// Consume internal ID
			this._idPool.consumeID( internalID );

			return internalID;

		} else {
			console.warn( `Node is already in the list.`, newNodeOptions.ref );
			return false;
		}
	}

	/**
	 * Removes IONode by ref
	 * 
	 * @param existingNodeRef Node reference passed while executing addNode()
	 */
	removeNode( existingNodeRef: Element ): void
	{	
		const nodeID = this._nodeReferences.get( existingNodeRef );

		if ( nodeID === undefined ){
			console.warn( `Node is not found in the list.`, existingNodeRef );
		} else {
			this._removeNodeByIds([ nodeID ]);
		}
	}

	/**
	 * Updates inline viewport properties and performs the following:
	 * 
	 * - Recalculates the Y position of each node
	 * - Resets each node's tracking events as if we are at Y = 0
	 * 
	 * @param screenHeight Visible screen height
	 * @param totalPageHeight Total page height including unvisible area to calculate total scroll value
	 */
	setViewport( screenHeight: number, totalPageHeight: number ): void
	{
		this._viewport = {
			_screenHeight: screenHeight,
			_totalPageHeight: totalPageHeight,
			_totalPossibleScroll: totalPageHeight - screenHeight
		};

		// Convert controlTable to Uint32Array if it's not enough
		if ( this._useRounded && this._viewport._totalPageHeight > 65535 && this._controlTable.table.constructor !== Uint32Array ){
			const newControlTable = Uint32Array.from( this._controlTable.table );
			this._controlTable.table = newControlTable;
		}

		this._nodes.forEach(( nodeSettings, nodeID ) => this._setElementBounds( nodeID, nodeSettings ));
	}

	/**
	 * @internal
	 */
	private _getFastForwardOption( option?: FastForwardOptions )
	{
		switch( option ){
			case "skip_both": return FastForwardData.SkipBoth;
			case "execute_both": return FastForwardData.ExecuteBoth;
			case "execute_last": return FastForwardData.ExecuteLast;
			default: return FastForwardData.SkipBoth;
		}
	}

	/**
	 * @internal
	 */
	private _setElementBounds( nodeID: number, nodeSettings: IONodeOptions )
	{
		const { start, end } = nodeSettings.getBounds();
		const elementOffset = nodeSettings.offset ? nodeSettings.offset : 0;
		
		const nodeStart = this._useRounded ? Math.round( start - elementOffset ) : start - elementOffset;
		const nodeEnd = this._useRounded ? Math.round( end + elementOffset ) : end + elementOffset;
		const isInViewport = ( this._viewport && nodeStart < this._viewport._screenHeight ) ? 1 : 0;

		// Only "top-out" and "bottom-in" are possible at the start (y = zero)
		this._controlTable.modifySlotByID( nodeID, {
			[ IONodeData.NodeStart ]: nodeStart,
			[ IONodeData.NodeEnd ]: nodeEnd,
			[ IONodeData.InViewport ]: isInViewport,
			[ IONodeData.TrackTopIn ]: 0,
			[ IONodeData.TrackTopOut ]: isInViewport ? 1 : 0,
			[ IONodeData.TrackBottomIn ]: isInViewport ? 0 : 1,
			[ IONodeData.TrackBottomOut ]: 0,
		} );
	}

	/**
	 * Removes tracking nodes by their internal id's.
	 * 
	 * @param nodeIDs Previosly created Node id
	 * @internal
	 */
	protected _removeNodeByIds( nodeIDs: number[] ): void
	{
		for ( const nodeID of nodeIDs ){

			const nodeSettings = this._nodes.get( nodeID )!;
			
			this._nodeReferences.delete( nodeSettings.ref );
			this._nodes.delete( nodeID );
			this._controlTable.removeSlot( nodeID );
			this._idPool.releaseID( nodeID );

			if ( nodeSettings.onRemoveNode ){
				nodeSettings.onRemoveNode();
			}

		}
	}

}