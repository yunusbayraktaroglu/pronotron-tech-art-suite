import throttle from "lodash.throttle";
import { 
	IONodeOptions,
	PronotronNodeID,
	IOEvent,
	ViewportProps,
} from "../../types/global";
import { 
	PronotronIONode, 
	NodeData 
} from "./PronotronIONode";

export { throttle };

export class PronotronIOController
{
    private static instance: PronotronIOEngine;

    private constructor(){}

    public static getInstance(): PronotronIOEngine {
        if ( ! PronotronIOController.instance ){
            PronotronIOController.instance = new PronotronIOEngine();
        }
        return PronotronIOController.instance;
    }
}

class PronotronIO
{
	/**
	 * We need to get a reference value from client use as KEY, 
	 * to avoid duplicate and to be able to respond remove requests.
	 */
	_nodeReferences: Map<Element, PronotronNodeID> = new Map();
	_nodes: Map<PronotronNodeID, { ioNode: IONodeOptions; pronotronNode: PronotronIONode }> = new Map();

	/**
	 * High frequency interleaved flatten @type {NodeData} table.
	 */
	_controlTable!: Uint16Array;
	_controlTableItemSize: number;

	_viewport = {
		_screenHeight: 0,
		_totalPageHeight: 0,
		_totalPossibleScroll: 0, // _totalPageHeight - _screenHeight
	};

	constructor()
	{
		/**
		 * @see https://stackoverflow.com/questions/38034673/determine-the-number-of-enum-elements-typescript
		 */
		this._controlTableItemSize = Object.keys( NodeData ).length / 2;
	}
	
	addNode( newNode: IONodeOptions ): false | number
	{
		/**
		 * We need to get a value from client to use as KEY, 
		 * to avoid duplicate and to be able to respond remove requests.
		 */
		if ( ! this._nodeReferences.has( newNode.ref ) ){

			const newPronotronNode = new PronotronIONode();

			/**
			 * In interleaved controlTable array we could only know PronotronIONode.id
			 * 
			 * - Use _nodeReferences as avoid duplicate and removal only
			 * - Use _nodes to find passed nodeData
			 */
			this._nodeReferences.set( newNode.ref, newPronotronNode.id );
			this._nodes.set( newPronotronNode.id, {
				ioNode: newNode,
				pronotronNode: newPronotronNode
			});

			return newPronotronNode.id;

		} else {
			console.warn( `Node is already in the list.`, newNode.ref );
			return false;
		}
	}

	removeNode( existingNodeRef: Element ): void
	{	
		const nodeID = this._nodeReferences.get( existingNodeRef );

		if ( ! nodeID ){
			console.warn( `Node is not found in the list.`, existingNodeRef );
		} else {
			this._nodeReferences.delete( existingNodeRef );
			this._nodes.delete( nodeID );
			this.removeElementInControlTable( nodeID );
		}
	}

	removeNodeById( nodeID: number ): void
	{
		const nodeRef = this._nodes.get( nodeID );

		if ( ! nodeRef ){
			console.warn( `NodeID is not found in the list.`, nodeID );
		} else {
			this.removeElementInControlTable( nodeID );
			this._nodeReferences.delete( nodeRef.ioNode.ref );
			this._nodes.delete( nodeID );
		}

	}

	/**
	 * Viewport should be passed externally, 
	 * every app might have a different logic. (Eg: transform 3D scroll apps)
	 * 
	 * @param viewport
	 */
	setViewport( viewport: ViewportProps ): void
	{
		this._viewport = {
			_screenHeight: viewport.screenHeight,
			_totalPageHeight: viewport.totalPageHeight,
			_totalPossibleScroll: viewport.totalPageHeight - viewport.screenHeight
		};

		this.buildControlTable();
	}

	removeElementInControlTable( nodeID: number ): void 
	{
		if ( ! this._controlTable ) return;

		const newControlTable = new Uint16Array( ( this._nodes.size - 1 ) * this._controlTableItemSize );
		let newIndex = 0;

		for ( let i = 0; i < this._nodes.size; i++ ){

			const offset = i * this._controlTableItemSize;

			if ( this._controlTable[ offset + NodeData.NodeID ] === nodeID ){
				continue;
			} 

			newControlTable.set( this._controlTable.slice( offset, offset + this._controlTableItemSize ), newIndex * this._controlTableItemSize );
			newIndex++;

		}

		this._controlTable = newControlTable;
	}

	buildControlTable(): void
	{
		this._controlTable = new Uint16Array( this._nodes.size * this._controlTableItemSize );

		let i = 0;

		this._nodes.forEach(({ pronotronNode, ioNode }) => {

			pronotronNode.y = ioNode.getYPosition();
			pronotronNode.calculatePossibleEvents( this._viewport._screenHeight, this._viewport._totalPossibleScroll );

			const nodeOffset = i * this._controlTableItemSize;

			this._controlTable.set( pronotronNode.controlTable, nodeOffset );

			/**
			 * Only "top-out" and "bottom-in" are possible on initialization.
			 */
			if ( pronotronNode.y < this._viewport._screenHeight ){
				this.updateControlTable( nodeOffset, 0, 1, 0, 0 );
			} else {
				this.updateControlTable( nodeOffset, 0, 0, 1, 0 );
			}

			i++;
		});
	}

	/**
	 * Updates node's tracking events in _controlTable
	 * 
	 * @param nodeOffset Node start index in interleaved _controlTable native array
	 * @param topIn Track "top-in"
	 * @param topOut Track "top-out"
	 * @param bottomIn Track "bottom-in"
	 * @param bottomOut Track "bottom-out"
	 */
	updateControlTable( nodeOffset: number, topIn: 1 | 0, topOut: 1 | 0, bottomIn: 1 | 0, bottomOut: 1 | 0 ): void
	{
		this._controlTable[ nodeOffset + NodeData.TopIn ] = topIn;
		this._controlTable[ nodeOffset + NodeData.TopOut ] = topOut;
		this._controlTable[ nodeOffset + NodeData.BottomIn ] = bottomIn;
		this._controlTable[ nodeOffset + NodeData.BottomOut ] = bottomOut;
	}

}




class PronotronIOEngine extends PronotronIO
{
	// Start at 0 even with a jumpy start value, to run handleScroll correctly
	_lastScrollY = 0;
	public direction: "up" | "down" = "down";

	handleResize( viewport: ViewportProps ): void 
	{
		// OnResize reset the _lastScrollY to able handleScroll() run correctly
		this._lastScrollY = 0;
		this.setViewport( viewport );
	}

	handleScroll( scrollY: number ): void 
	{
		// Skips initial run for scroll value = 0
		if ( scrollY == this._lastScrollY ) return;

		if ( scrollY > this._lastScrollY ){
			this.direction = "down";
			this.#handleScrollDown( scrollY, this._viewport._screenHeight );
		} else {
			this.direction = "up";
			this.#handleScrollUp( scrollY, this._viewport._screenHeight );
		}

		this._lastScrollY = scrollY;
	}

	/**
	 * User is SCROLLING DOWN.
	 * Only "top-out" and "bottom-in" events are possible.

	 * @param scrollY Current scrollY value (window.scrollY) to calculate top (scrollY)
	 * @param viewportHeight Current viewportHeight to calculate bottom (scrollY + viewportHeight)
	 */
	#handleScrollDown( scrollY: number, viewportHeight: number ): void 
	{
		/**
		 * @important
		 * Check "bottom-in" first:
		 * Initial scrollY might be a jumpy value to make an element first "bottom-in" then "top-out".
		 * 
		 * @important
		 * We need to iterate over the _controlGroupsTable in reverse order. 
		 * This way, removing elements won't affect the indices of the yet-to-be-processed elements.
		 */
		const nodesToRemove: number[] = [];

		for ( let i = 0; i < this._nodes.size; i++ ){

			let offset = i * this._controlTableItemSize;
			let elementY = this._controlTable[ offset + NodeData.NodeYPosition ];
			let nodeID = this._controlTable[ offset + NodeData.NodeID ];

			// bottom-in
			if ( this._controlTable[ offset + NodeData.BottomIn ] && elementY < ( scrollY + viewportHeight ) ){
				if ( this.#dispatchEvent( nodeID, "bottom-in" ) ){
					nodesToRemove.push( nodeID );
					continue;
				} else {
					// Activate "top-out", "bottom-out"
					this.updateControlTable( offset, 0, 1, 0, 1 );
				}
			}

			// top-out
			if ( this._controlTable[ offset + NodeData.TopOut ] && elementY < scrollY ){
				if ( this.#dispatchEvent( nodeID, "top-out" ) ){
					nodesToRemove.push( nodeID );
					continue;
				} else {
					// Activate "top-in"
					this.updateControlTable( offset, 1, 0, 0, 0 );
				}
			}

		}

		// Run remove action seperately to do not confuse _controlTable iteration
		nodesToRemove.forEach( nodeID => this.removeNodeById( nodeID ) );

	}

	/**
	 * User is SCROLLING UP.
	 * Only "top-in" and "bottom-out" are possible.
	 * 
	 * @param scrollY Current scrollY value (window.scrollY) to calculate top (scrollY)
	 * @param viewportHeight Current viewportHeight to calculate bottom (scrollY + viewportHeight)
	 */
	#handleScrollUp( scrollY: number, viewportHeight: number ): void
	{
		/**
		 * @important
		 * Check "top-in" first:
		 * Instant changes on scrollY might be a big value to 
		 * make an element "top-in" first then "bottom-out".
		 * 
		 * @important
		 * We need to iterate over the _controlGroupsTable in reverse order. 
		 * This way, removing elements won't affect the indices of the yet-to-be-processed elements.
		 */

		// Iterate over map size
		const nodesToRemove = [];

		for ( let i = 0; i < this._nodes.size; i++ ){

			let offset = i * this._controlTableItemSize;
			let elementY = this._controlTable[ offset + NodeData.NodeYPosition ];
			let nodeID = this._controlTable[ offset + NodeData.NodeID ];

			// top-in
			if ( this._controlTable[ offset + NodeData.TopIn ] && elementY > scrollY ){
				if ( this.#dispatchEvent( nodeID, "top-in" ) ){
					nodesToRemove.push( nodeID );
					continue;
				} else {
					// Activate "top-out", "bottom-out"
					this.updateControlTable( offset, 0, 1, 0, 1 );
				}
			}

			// bottom-out
			if ( this._controlTable[ offset + NodeData.BottomOut ] && elementY > ( scrollY + viewportHeight ) ){
				if ( this.#dispatchEvent( nodeID, "bottom-out" ) ){
					nodesToRemove.push( nodeID );
					continue;
				} else {
					// Activate "bottom-in"
					this.updateControlTable( offset, 0, 0, 1, 0 );
				}
			}

		}

		// Run remove action seperately to do not confuse _controlTable iteration
		nodesToRemove.forEach( nodeID => this.removeNodeById( nodeID ) );
	}

	/**
	 * Dispatch defined Node function for given event
	 * 
	 * @param nodeID Node id
	 * @param event Dispatched event
	 * @returns true if node needs to be deleted
	 */
	#dispatchEvent( nodeID: number, event: IOEvent ): boolean
	{
		const ioNode = this._nodes.get( nodeID )!.ioNode;

		/**
		 * Node may be tracked for only certain events
		 */
		if ( ioNode.dispatch[ event ] ){

			ioNode.dispatch[ event ]();

			if ( "retry" in ioNode.dispatch ){

				// Update usage time
				ioNode.dispatch.retry -= 1;
				return ioNode.dispatch.retry < 1;

			}

			// Continious node
			return false;

		} else {
			return false;
		}
	}

}