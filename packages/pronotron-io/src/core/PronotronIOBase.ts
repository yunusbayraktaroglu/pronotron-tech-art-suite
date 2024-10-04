import { 
	PronotronNodeRef,
	IONodeOptions,
	PronotronNodeID,
	ViewportProps,
} from "../../types/global";
import { PronotronIONode } from "./PronotronIONode";
import { PronotronIOControlTable } from "./PronotronIOControlTable";

interface IPronotronIOBase {
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
	 * Removes tracking nodes by their id's.
	 * 
	 * @param nodeIDs Previosly created Node id
	 */
	_removeNodeByIds( nodeIDs: PronotronNodeID[] ): void;
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
	handleResize( viewportProps: ViewportProps ): void;
}

export abstract class PronotronIOBase implements IPronotronIOBase
{
	abstract handleScroll( scrollY: number ): void;
	abstract handleResize( viewportProps: ViewportProps ): void;

	/**
	 * We need to get a value from client to use as KEY, 
	 * to avoid duplicate and to be able to respond remove requests.
	 */
	public _nodeReferences: Map<PronotronNodeRef, PronotronNodeID> = new Map();
	/**
	 * PronotronIO node object with id's.
	 */
	public _nodes: Map<PronotronNodeID, PronotronIONode> = new Map();

	public _viewport: undefined | {
		_screenHeight: number,
		_totalPageHeight: number,
		_totalPossibleScroll: number, // _totalPageHeight - _screenHeight
	};

	/**
	 * High frequency access interleaved typed array
	 */
	public _controlTable: PronotronIOControlTable;

	/**
	 * @param nodeCountHint To populate fixed Typed Array length
	 */
	constructor( nodeCountHint = 20 )
	{
		this._controlTable = new PronotronIOControlTable( nodeCountHint );
	}

	addNode( newNodeOptions: IONodeOptions ): false | PronotronNodeID
	{
		if ( ! this._nodeReferences.has( newNodeOptions.ref ) ){

			const newPronotronNode = new PronotronIONode( newNodeOptions );

			/**
			 * Nodes may be added while application is already running and ready,
			 * if the application is already running execute calculatePossibleEvents() for the node
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
			this._controlTable.addNode( newPronotronNode );

			return newPronotronNode.id;

		} else {
			console.warn( `Node is already in the list.`, newNodeOptions.ref );
			return false;
		}
	}

	removeNode( existingNodeRef: Element ): void
	{	
		const nodeID = this._nodeReferences.get( existingNodeRef );

		if ( ! nodeID ){
			console.warn( `Node is not found in the list.`, existingNodeRef );
		} else {
			const node = this._nodes.get( nodeID )!;
			
			this._controlTable.deleteNodes( nodeID );
			this._nodeReferences.delete( existingNodeRef );
			this._nodes.delete( nodeID );

			if ( node.settings.onRemoveNode ){
				node.settings.onRemoveNode();
			}
		}
	}

	setViewport( viewport: ViewportProps ): void
	{
		this._viewport = {
			_screenHeight: viewport.screenHeight,
			_totalPageHeight: viewport.totalPageHeight,
			_totalPossibleScroll: viewport.totalPageHeight - viewport.screenHeight
		};

		this._nodes.forEach(( pronotronNode ) => {

			pronotronNode.y = pronotronNode.settings.getYPosition();
			pronotronNode.calculatePossibleEvents( this._viewport!._screenHeight, this._viewport!._totalPossibleScroll );

			this._controlTable.updateYPosition( pronotronNode.id, pronotronNode.y );
			
			/**
			 * Only "top-out" and "bottom-in" are possible on initialization.
			 */
			if ( pronotronNode.y < this._viewport!._screenHeight ){
				this._controlTable.updateNodeTrackingData( pronotronNode.id, {
					topIn: 0,
					// @ts-expect-error - Possible events calculated at top
					topOut: pronotronNode.possibleEvents[ "top-out" ] ? 1 : 0,
					bottomIn: 0,
					bottomOut: 0
				} );
			} else {
				this._controlTable.updateNodeTrackingData( pronotronNode.id, {
					topIn: 0,
					topOut: 0,
					// @ts-expect-error - Possible events calculated at top
					bottomIn: pronotronNode.possibleEvents[ "bottom-in" ] ? 1 : 0,
					bottomOut: 0
				} );
			}
		});
	}

	_removeNodeByIds( nodeIDs: number[] ): void
	{
		for ( const nodeID of nodeIDs ){
			const pronotronNode = this._nodes.get( nodeID )!;
			
			this._nodeReferences.delete( pronotronNode.settings.ref );
			this._nodes.delete( nodeID );

			if ( pronotronNode.settings.onRemoveNode ){
				pronotronNode.settings.onRemoveNode();
			}
		}

		this._controlTable.deleteNodes( ...nodeIDs );
	}

}