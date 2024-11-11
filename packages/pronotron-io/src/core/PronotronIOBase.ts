import { 
	PronotronNodeRef,
	IONodeOptions,
	PronotronNodeID,
	ViewportProps,
	FastForwardOptions
} from "../../types/global";
import { NativeControlTable, IDPool } from "@pronotron/utils";

export enum IONodeData {
	TrackTopIn,
	TrackTopOut,
	TrackBottomIn,
	TrackBottomOut,
	InViewport,
	NodeYPosition,
	NodeOffset,
	NodeID,
	OnViewportEvent,
	OnTopInEvent,
	OnTopOutEvent,
	OnBottomInEvent,
	OnBottomOutEvent,
	OnFastForward
};

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

	/**
	 * @param nodeCountHint To populate fixed Typed Array length
	 */
	constructor( nodeCountHint = 20 )
	{
		/**
		 * Using Object.keys( IONodeData ).length / 2 to calculate stride is possible,
		 * but that causes IONodeData included in the export as object.
		 */
		this._controlTable =  new NativeControlTable( 14, Uint32Array, nodeCountHint );
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
			 * Nodes may be added while application is already running and ready, (next.js page change)
			 * if the application is already running, execute calculatePossibleEvents() for the node
			 */
			if ( this._viewport ){
				//newPronotronNode.calculatePossibleEvents( this._viewport._screenHeight, this._viewport._totalPossibleScroll );
			}

			/**
			 * In interleaved controlTable array we could only know PronotronIONode.id
			 * 
			 * - Use _nodeReferences as avoid duplicate and removal only
			 * - Use _nodes to find passed nodeData
			 */
			this._nodeReferences.set( newNodeOptions.ref, internalID );
			this._nodes.set( internalID, newNodeOptions );

			const yPosition = newNodeOptions.getYPosition();
			const isInViewport = ( this._viewport && yPosition < this._viewport._screenHeight ) ? 1 : 0;
			const fastForwardOptions = this._getFastForwardOption( newNodeOptions.dispatch.onFastForward );

			// Only "top-out" and "bottom-in" are possible at the start (y = zero)
			this._controlTable.addSlot( internalID, {
				[ IONodeData.NodeID ]: internalID,
				[ IONodeData.NodeYPosition ]: yPosition,
				[ IONodeData.NodeOffset ]: newNodeOptions.offset ? newNodeOptions.offset : 0,
				[ IONodeData.TrackTopIn ]: 0,
				[ IONodeData.TrackTopOut ]: 1,
				[ IONodeData.TrackBottomIn ]: 1,
				[ IONodeData.TrackBottomOut ]: 0,
				[ IONodeData.InViewport ]: isInViewport,
				[ IONodeData.OnViewportEvent ]: newNodeOptions.dispatch.onInViewport ? 1 : 0,
				[ IONodeData.OnTopInEvent ]: newNodeOptions.dispatch.onTopIn ? 1 : 0,
				[ IONodeData.OnTopOutEvent ]: newNodeOptions.dispatch.onTopOut ? 1 : 0,
				[ IONodeData.OnBottomInEvent ]: newNodeOptions.dispatch.onBottomIn ? 1 : 0,
				[ IONodeData.OnBottomOutEvent ]: newNodeOptions.dispatch.onBottomOut ? 1 : 0,
				[ IONodeData.OnFastForward ]: fastForwardOptions
			});
			this._idPool.consumeID( internalID );

			return internalID;

		} else {
			console.warn( `Node is already in the list.`, newNodeOptions.ref );
			return false;
		}
	}

	/**
	 * Removes tracking of an active IO node
	 * 
	 * @param existingNodeRef Node reference passed while executing addNode()
	 */
	removeNode( existingNodeRef: Element ): void
	{	
		const nodeID = this._nodeReferences.get( existingNodeRef );

		if ( nodeID === undefined ){

			console.warn( `Node is not found in the list.`, existingNodeRef );

		} else {

			const nodeSettings = this._nodes.get( nodeID )!;
			
			this._controlTable.removeSlot( nodeID );
			this._nodeReferences.delete( existingNodeRef );
			this._nodes.delete( nodeID );
			this._idPool.releaseID( nodeID );

			if ( nodeSettings.onRemoveNode ){
				nodeSettings.onRemoveNode();
			}

		}
	}

	/**
	 * Updates inline viewport properties and performs the following:
	 * 
	 * - Recalculates the Y position of each node
	 * - Resets each node's tracking events as if we are at Y = 0
	 */
	setViewport( viewport: ViewportProps ): void
	{
		this._viewport = {
			_screenHeight: viewport.screenHeight,
			_totalPageHeight: viewport.totalPageHeight,
			_totalPossibleScroll: viewport.totalPageHeight - viewport.screenHeight
		};

		this._nodes.forEach(( nodeSettings, nodeID ) => {

			const newYPosition = nodeSettings.getYPosition();

			if ( newYPosition < this._viewport!._screenHeight ){

				this._controlTable.modifySlotByID( nodeID, {
					[ IONodeData.NodeYPosition ]: newYPosition,
					[ IONodeData.InViewport ]: 1,
					[ IONodeData.TrackTopIn ]: 0,
					[ IONodeData.TrackTopOut ]: 1,
					[ IONodeData.TrackBottomIn ]: 0,
					[ IONodeData.TrackBottomOut ]: 0,
				} );

			} else {

				this._controlTable.modifySlotByID( nodeID, {
					[ IONodeData.NodeYPosition ]: newYPosition,
					[ IONodeData.InViewport ]: 0,
					[ IONodeData.TrackTopIn ]: 0,
					[ IONodeData.TrackTopOut ]: 0,
					[ IONodeData.TrackBottomIn ]: 1,
					[ IONodeData.TrackBottomOut ]: 0,
				} );

			}

		});
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