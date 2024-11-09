import { 
	PronotronNodeRef,
	IONodeOptions,
	PronotronNodeID,
	ViewportProps,
} from "../../types/global";
import { PronotronIONode } from "./PronotronIONode";
import { NativeControlTable, IDPool } from "@pronotron/utils";

export enum IONodeData {
	TopIn = 0,
	TopOut = 1,
	BottomIn = 2,
	BottomOut = 3,
	NodeYPosition = 4,
	NodeID = 5,
};

interface IPronotronIOBase {
	/**
	 * Uint16: 0 to 65535
	 * Uint32: 0 to 4294967295
	 */
	_controlTable: NativeControlTable<typeof IONodeData>;

	/**
	 * Creates a tracking node.
	 * 
	 * @param nodeOptions IO node creation options
	 * @returns false if error, node instance id if success
	 */
	addNode( nodeOptions: IONodeOptions ) : false | PronotronNodeID;
	/**
	 * Removes a tracking node.
	 * 
	 * @param ref Node reference passed while executing addNode()
	 */
	removeNode( ref: PronotronNodeRef ): void;

	/**
	 * Viewport props should be passed externally, 
	 * every app might have a different logic. (Eg: transform 3D scroll apps).
	 * Updates inline viewport object and recalculates each node possible events.
	 * 
	 * @param viewport Screen height and total page height
	 */
	setViewport( viewportProps: ViewportProps ): void;
	/**
	 * Abstract methods
	 */
	handleScroll( scrollY: number ): void;
}

export abstract class PronotronIOBase implements IPronotronIOBase
{
	abstract handleScroll( scrollY: number ): void;

	/**
	 * We need to get a value from client to use as KEY, 
	 * to avoid duplicate and to be able to respond remove requests.
	 */
	public _nodeReferences: Map<PronotronNodeRef, PronotronNodeID> = new Map();
	
	/**
	 * PronotronIO node object with id's.
	 */
	public _nodes: Map<PronotronNodeID, PronotronIONode> = new Map();

	public _lastScrollY = 0;
	public _viewport: undefined | {
		_screenHeight: number,
		_totalPageHeight: number,
		_totalPossibleScroll: number, // _totalPageHeight - _screenHeight
	};

	/**
	 * High frequency access interleaved typed array
	 * Uint16: 0 to 65535 for long scroll values
	 * Uint32: 0 to 4294967295 for very long scroll values
	 */
	_controlTable: NativeControlTable<typeof IONodeData>;

	private _idPool: IDPool;

	/**
	 * @param nodeCountHint To populate fixed Typed Array length
	 */
	constructor( nodeCountHint = 20 )
	{
		this._controlTable =  new NativeControlTable( IONodeData, Uint32Array, nodeCountHint );
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
			this._idPool.consumeID( internalID );

			const newPronotronNode = new PronotronIONode( newNodeOptions, internalID );

			/**
			 * Nodes may be added while application is already running and ready, (next.js page change)
			 * if the application is already running, execute calculatePossibleEvents() for the node
			 */
			if ( this._viewport ){
				newPronotronNode.calculatePossibleEvents( this._viewport._screenHeight, this._viewport._totalPossibleScroll );
			}

			/**
			 * In interleaved controlTable array we could only know PronotronIONode.id
			 * 
			 * - Use _nodeReferences as avoid duplicate and removal only
			 * - Use _nodes to find passed nodeData
			 */
			this._nodeReferences.set( newNodeOptions.ref, newPronotronNode.id );
			this._nodes.set( newPronotronNode.id, newPronotronNode );

			// Only "top-out" and "bottom-in" are possible at the start (y = zero)
			this._controlTable.addSlot( newPronotronNode.id, {
				[ IONodeData.TopIn ]: 0,
				[ IONodeData.TopOut ]: 1,
				[ IONodeData.BottomIn ]: 1,
				[ IONodeData.BottomOut ]: 0,
				[ IONodeData.NodeID ]: newPronotronNode.id,
				[ IONodeData.NodeYPosition]: newPronotronNode.y,
			});

			return newPronotronNode.id;

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

			const node = this._nodes.get( nodeID )!;
			
			this._controlTable.removeSlot( nodeID );
			this._nodeReferences.delete( existingNodeRef );
			this._nodes.delete( nodeID );
			this._idPool.releaseID( nodeID );

			if ( node.settings.onRemoveNode ){
				node.settings.onRemoveNode();
			}

		}
	}

	/**
	 * Updates inline viewport properties and performs the following:
	 * 
	 * - Recalculates the Y position of each node
	 * - Recalculates the possible events for each node based on the new viewport properties
	 * - Resets each node's tracking events as if we are at Y = 0
	 */
	setViewport( viewport: ViewportProps ): void
	{
		this._viewport = {
			_screenHeight: viewport.screenHeight,
			_totalPageHeight: viewport.totalPageHeight,
			_totalPossibleScroll: viewport.totalPageHeight - viewport.screenHeight
		};

		this._nodes.forEach( pronotronNode => {

			pronotronNode.y = pronotronNode.settings.getYPosition();
			pronotronNode.calculatePossibleEvents( this._viewport!._screenHeight, this._viewport!._totalPossibleScroll );

			this._controlTable.modifySlotByID( pronotronNode.id, {
				[ IONodeData.NodeYPosition ]: pronotronNode.y
			});
			
		});

		this._resetNodesTrackingEvents();
	}

	/**
	 * Resets tracking events.
	 * Prepares app to be like in initial state for responding scroll request.
	 * 
	 * @todo - There is no need to check again if viewport doesnt changed
	 */
	reset()
	{
		/**
		 * If viewport is not defined yet, it means initialization not yet done.
		 */
		if ( this._viewport ){
			this._resetNodesTrackingEvents();
			this._lastScrollY = 0;
		}
	}

	/**
	 * Resets each node's tracking events as if we are at Y = 0
	 */
	protected _resetNodesTrackingEvents()
	{
		this._nodes.forEach( pronotronNode => {
			if ( pronotronNode.y < this._viewport!._screenHeight ){
				this._controlTable.modifySlotByID( pronotronNode.id, {
					[ IONodeData.TopIn ]: 0,
					// @ts-expect-error - Possible events calculated at top
					[ IONodeData.TopOut ]: pronotronNode.possibleEvents[ "top-out" ] ? 1 : 0,
					[ IONodeData.BottomIn ]: 0,
					[ IONodeData.BottomOut ]: 0,
				} );
			} else {
				this._controlTable.modifySlotByID( pronotronNode.id, {
					[ IONodeData.TopIn ]: 0,
					[ IONodeData.TopOut ]: 0,
					// @ts-expect-error - Possible events calculated at top
					[ IONodeData.BottomIn ]: pronotronNode.possibleEvents[ "bottom-in" ] ? 1 : 0,
					[ IONodeData.BottomOut ]: 0,
				} );
			}
		})
	}

	/**
	 * Removes tracking nodes by their internal id's.
	 * 
	 * @param nodeIDs Previosly created Node id
	 */
	protected _removeNodeByIds( nodeIDs: number[] ): void
	{
		for ( const nodeID of nodeIDs ){
			const pronotronNode = this._nodes.get( nodeID )!;
			
			this._nodeReferences.delete( pronotronNode.settings.ref );
			this._nodes.delete( nodeID );
			this._controlTable.removeSlot( nodeID );
			this._idPool.releaseID( nodeID );

			if ( pronotronNode.settings.onRemoveNode ){
				pronotronNode.settings.onRemoveNode();
			}
		}
	}

}