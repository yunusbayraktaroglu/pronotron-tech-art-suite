import { IOVerticalEvent } from "../../types/global";
import { IONodeData, PronotronIOBase } from "./PronotronIOBase";

/**
 * Virtually checks intersection over node's y position and viewport properties. 
 * Waits for handleScroll() method.
 * 
 * @example
 * const pronotronIO = new PronotronIOVertical();
 * pronotronIO.setScrollY( 0 );
 * pronotronIO.addNode({
 * 	ref: element,
 * 	dispatch: {
 * 		"top-in": () => console.log( "Element in from top" ),
 * 		"bottom-out": () => console.log( "Element out from bottom" ),
 * 	},
 * 	onRemoveNode: () => element.dataset.ioActive = "0",
 * 	getYPosition: () => element.getBoundingClientRect().top + window.scrollY,
 * });
 * // It's better to use with a throttle function
 * window.addEventListener( 'scroll', () => pronotronIO.handleScroll( window.scrollY ) );
 */
export class PronotronIOVertical extends PronotronIOBase
{
	// Start at 0 even with a jumpy start value, to track passed nodes correctly
	public direction: "up" | "down" = "down";

	setLastScrollY( scrollY: number ): void 
	{
		this._lastScrollY = scrollY;
	}

	handleScroll( scrollY: number ): void 
	{
		// Skips initial run for scroll value = 0
		if ( scrollY === this._lastScrollY ) return;

		if ( scrollY > this._lastScrollY ){

			this.direction = "down";
			this._handleScrollDown( scrollY, this._viewport!._screenHeight );

		} else {

			this.direction = "up";
			this._handleScrollUp( scrollY, this._viewport!._screenHeight );

		}

		this._lastScrollY = scrollY;
	}

	/**
	 * User is SCROLLING DOWN.
	 * Only "top-out" and "bottom-in" events are possible.
	 * 
	 * @param scrollY Current scrollY value (window.scrollY) to calculate top (scrollY)
	 * @param viewportHeight Current viewportHeight to calculate bottom (scrollY + viewportHeight)
	 */
	private _handleScrollDown( scrollY: number, viewportHeight: number ): void 
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
		const controlTable = this._controlTable.table;

		for ( let i = 0; i < this._controlTable.usedSlots; i++ ){

			const offset = i * this._controlTable.stride;
			const nodeID = controlTable[ offset + IONodeData.NodeID ];
			const elementY = controlTable[ offset + IONodeData.NodeYPosition ];
			const elementOffset = controlTable[ offset + IONodeData.NodeOffset ];

			let bottomIn = 0;
			let topOut = 0;
			
			/**
			 * @note
			 * We need to track every event even the node is not has a dispatcher on these events, 
			 * to switch between possible events for fast calculation
			 */
			// Check bottom-in
			if ( controlTable[ offset + IONodeData.BottomIn ] && elementY - elementOffset < ( scrollY + viewportHeight ) ){
				bottomIn = 1;
				// Activate "top-out", "bottom-out"
				this._controlTable.modifySlotByPosition( i, {
					[ IONodeData.TopIn ]: 0,
					[ IONodeData.TopOut ]: 1,
					[ IONodeData.BottomIn ]: 0,
					[ IONodeData.BottomOut ]: 1,
				} );
			}

			// Check top-out
			if ( controlTable[ offset + IONodeData.TopOut ] && elementY + elementOffset < scrollY ){
				topOut = 1;
				// Activate "top-in"
				this._controlTable.modifySlotByPosition( i, {
					[ IONodeData.TopIn ]: 1,
					[ IONodeData.TopOut ]: 0,
					[ IONodeData.BottomIn ]: 0,
					[ IONodeData.BottomOut ]: 0,
				} );
			}

			// Element fast-forwarded (bottom-in then top-out, jumpy scroll)
			if ( bottomIn && topOut ){
				console.log( "FAST FORWARD" );
				continue;
			} else {

				/**
				 * @todo
				 * Dispatch events if only exist
				 * add IONodeData.DispatchBottomIn ...
				 */
				if ( bottomIn && this._dispatchEvent( nodeID, "bottom-in" ) ){
					nodesToRemove.push( nodeID );
					continue;
				}
				if ( topOut && this._dispatchEvent( nodeID, "top-out" ) ){
					nodesToRemove.push( nodeID );
					continue;
				}
			}

			// Element in viewport
			if ( 
				controlTable[ offset + IONodeData.TrackViewport ] && 
				controlTable[ offset + IONodeData.TopOut ] && 
				controlTable[ offset + IONodeData.BottomOut ] 
			){
				const normalizedViewPosition = ( 2 * ( elementY - scrollY ) / viewportHeight ) - 1;
				const normalizedWithOffset = ( 2 * ( elementY - scrollY + elementOffset ) / ( viewportHeight + elementOffset + elementOffset ) ) - 1;
				this._renderEvent( nodeID, normalizedWithOffset );
			}

		}

		// Run remove action seperately to do not confuse _controlTable iteration
		this._removeNodeByIds( nodesToRemove );
	}

	/**
	 * User is SCROLLING UP.
	 * Only "top-in" and "bottom-out" are possible.
	 * 
	 * @param scrollY Current scrollY value (window.scrollY) to calculate top (scrollY)
	 * @param viewportHeight Current viewportHeight to calculate bottom (scrollY + viewportHeight)
	 */
	private _handleScrollUp( scrollY: number, viewportHeight: number ): void
	{
		/**
		 * @important
		 * Check "top-in" first:
		 * Instant changes on scrollY might be a big value to make an element "top-in" first then "bottom-out".
		 * 
		 * @important
		 * We need to iterate over the _controlGroupsTable in reverse order. 
		 * This way, removing elements won't affect the indices of the yet-to-be-processed elements.
		 */
		const nodesToRemove: number[] = [];
		const controlTable = this._controlTable.table;

		for ( let i = 0; i < this._controlTable.usedSlots; i++ ){

			const offset = i * this._controlTable.stride;
			const nodeID = controlTable[ offset + IONodeData.NodeID ];
			const elementY = controlTable[ offset + IONodeData.NodeYPosition ];
			const elementOffset = controlTable[ offset + IONodeData.NodeOffset ];

			let topIn = 0;
			let bottomOut = 0;

			// Check top-in
			if ( controlTable[ offset + IONodeData.TopIn ] && elementY + elementOffset > scrollY ){
				topIn = 1;
				// Activate "top-out", "bottom-out"
				this._controlTable.modifySlotByPosition( i, {
					[ IONodeData.TopIn ]: 0,
					[ IONodeData.TopOut ]: 1,
					[ IONodeData.BottomIn ]: 0,
					[ IONodeData.BottomOut ]: 1,
				} );
			}

			// Check bottom-out
			if ( controlTable[ offset + IONodeData.BottomOut ] && elementY - elementOffset > ( scrollY + viewportHeight ) ){
				bottomOut = 1;
				// Activate "bottom-in"
				this._controlTable.modifySlotByPosition( i, {
					[ IONodeData.TopIn ]: 0,
					[ IONodeData.TopOut ]: 0,
					[ IONodeData.BottomIn ]: 1,
					[ IONodeData.BottomOut ]: 0,
				} );
			}

			// Element fast-forwarded (bottom-in then top-out, jumpy scroll)
			if ( topIn && bottomOut ){
				console.log( "FAST FORWARD" );
				continue;
			} else {
				if ( topIn && this._dispatchEvent( nodeID, "top-in" ) ){
					nodesToRemove.push( nodeID );
					continue;
				}
				if ( bottomOut && this._dispatchEvent( nodeID, "bottom-out" ) ){
					nodesToRemove.push( nodeID );
					continue;
				}
			}

			// Element in viewport
			if ( 
				controlTable[ offset + IONodeData.TrackViewport ] && 
				controlTable[ offset + IONodeData.TopOut ] && 
				controlTable[ offset + IONodeData.BottomOut ] 
			){
				const normalizedViewPosition = ( 2 * ( elementY - scrollY ) / viewportHeight ) - 1;
				const normalizedWithOffset = ( 2 * ( elementY - scrollY + elementOffset ) / ( viewportHeight + elementOffset + elementOffset ) ) - 1;
				this._renderEvent( nodeID, normalizedWithOffset );
			}

		}

		// Run remove action seperately to do not confuse _controlTable iteration
		this._removeNodeByIds( nodesToRemove );
	}

	private _renderEvent( nodeID: number, normalizedViewPosition: number )
	{
		const ioNodeOptions = this._nodes.get( nodeID )!.settings;
		ioNodeOptions.dispatch.visible!( normalizedViewPosition );
	}

	/**
	 * Dispatch defined Node function for given event
	 * 
	 * @param nodeID Node id
	 * @param event Dispatched event
	 * @returns true if node needs to be deleted
	 */
	private _dispatchEvent( nodeID: number, event: IOVerticalEvent ): boolean
	{
		const ioNodeOptions = this._nodes.get( nodeID )!.settings;

		/**
		 * Node may be tracked for only certain events
		 */
		if ( ioNodeOptions.dispatch[ event ] ){

			ioNodeOptions.dispatch[ event ]();

			/**
			 * Node may have limited dispatch
			 */
			if ( "retry" in ioNodeOptions.dispatch ){

				// Update usage time
				ioNodeOptions.dispatch.retry -= 1;
				return ioNodeOptions.dispatch.retry < 1;

			}

			return false;

		} else {
			return false;
		}
	}

}