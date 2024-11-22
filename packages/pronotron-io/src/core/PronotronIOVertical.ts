import { IOVerticalEvent } from "../../types/global";
import { IONodeData, FastForwardData, PronotronIOBase } from "./PronotronIOBase";

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
 * 		onInViewport: ( normalizedPosition: number ) => console.log( "Element in from top" ),
 * 		onTopIn: () => console.log( "Element in from top" ),
 * 		onTopOut: {
 * 			dispatch: () => console.log( "Element out from top" ),
 * 			limit: 1
 * 		},
 * 		onBottomIn...,
 * 		onBottomOut...,
 * 		onFastForward: "execute_both",
 * 	},
 * 	onRemoveNode: () => element.dataset.ioActive = "0",
 * 	getBounds: () => { 
 * 		top: element.getBoundingClientRect().top + window.scrollY,
 * 		bottom: element.getBoundingClientRect().bottom + window.scrollY
 * 	}
 * 	offset: 100, // In pixels, seperately added for both direction
 * });
 * // It's better to use with a throttle function
 * window.addEventListener( 'scroll', () => pronotronIO.handleScroll( window.scrollY ) );
 */
export class PronotronIOVertical extends PronotronIOBase
{
	/**
	 * Points the direction of the scroll by last scroll
	 */
	public direction: "up" | "down" = "down";

	/**
	 * Handles scroll between last scroll and current scroll
	 * 
	 * @param scrollY Scroll value
	 */
	setLastScrollY( scrollY: number ): void 
	{
		this._lastScrollY = scrollY;
	}

	/**
	 * Handles scroll by last scroll and current scroll
	 * 
	 * @param scrollY Current scroll value
	 */
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
	 * Only  "bottom-in" and "top-out" events are possible.
	 * 
	 * @param scrollY Current scrollY value (window.scrollY) to calculate top (scrollY)
	 * @param viewportHeight Current viewportHeight to calculate bottom (scrollY + viewportHeight)
	 * 
	 * @internal
	 */
	private _handleScrollDown( scrollY: number, viewportHeight: number ): void 
	{
		const nodesToRemove: number[] = [];
		const controlTable = this._controlTable.table;

		for ( let i = 0; i < this._controlTable.usedSlots; i++ ){

			const offset = i * this._controlTable.stride;
			const nodeID = controlTable[ offset + IONodeData.NodeID ];
			const elementTop = controlTable[ offset + IONodeData.NodeStart ];
			const elementBottom = controlTable[ offset + IONodeData.NodeEnd ];

			/**
			 * @note
			 * We need to track every in-out events, even the node hasn't a dispatcher on these events, 
			 * to switch between possible events for fast calculation.
			 * 
			 * bottomIn and topOut events seperately recorded to understand a "fast forward".
			 * Check bottomIn then topOut.
			 */
			let bottomIn = 0;
			let topOut = 0;

			if ( controlTable[ offset + IONodeData.TrackBottomIn ] && ( elementTop < scrollY + viewportHeight ) ){
				bottomIn = 1;
				// Activate "top-out", "bottom-out"
				this._controlTable.modifySlotByPosition( i, {
					[ IONodeData.InViewport ]: 1,
					[ IONodeData.TrackTopIn ]: 0,
					[ IONodeData.TrackTopOut ]: 1,
					[ IONodeData.TrackBottomIn ]: 0,
					[ IONodeData.TrackBottomOut ]: 1,
				} );
			}
			if ( controlTable[ offset + IONodeData.TrackTopOut ] && ( elementBottom < scrollY ) ){
				topOut = 1;
				// Activate "top-in"
				this._controlTable.modifySlotByPosition( i, {
					[ IONodeData.InViewport ]: 0,
					[ IONodeData.TrackTopIn ]: 1,
					[ IONodeData.TrackTopOut ]: 0,
					[ IONodeData.TrackBottomIn ]: 0,
					[ IONodeData.TrackBottomOut ]: 0,
				} );
			}

			// Element fast-forwarded (bottom-in then top-out, jumpy scroll)
			if ( bottomIn && topOut ){

				if ( controlTable[ offset + IONodeData.OnFastForward ] !== FastForwardData.SkipBoth ){
					switch( controlTable[ offset + IONodeData.OnFastForward ] ){
						case FastForwardData.ExecuteLast: {
							if ( controlTable[ offset + IONodeData.OnTopOutEvent ] ){
								controlTable[ offset + IONodeData.OnTopOutEvent ] = this._dispatchEvent( nodeID, "onTopOut" );
							}
							break;
						}
						case FastForwardData.ExecuteBoth: {
							if ( controlTable[ offset + IONodeData.OnBottomInEvent ] ){
								controlTable[ offset + IONodeData.OnBottomInEvent ] = this._dispatchEvent( nodeID, "onBottomIn" );
							}
							if ( controlTable[ offset + IONodeData.OnTopOutEvent ] ){
								controlTable[ offset + IONodeData.OnTopOutEvent ] = this._dispatchEvent( nodeID, "onTopOut" );
							}
							break;
						};
					}
				}
				
				continue;

			} else {
				if ( bottomIn && controlTable[ offset + IONodeData.OnBottomInEvent ] ){
					controlTable[ offset + IONodeData.OnBottomInEvent ] = this._dispatchEvent( nodeID, "onBottomIn" );
				}
				if ( topOut && controlTable[ offset + IONodeData.OnTopOutEvent ] ){
					controlTable[ offset + IONodeData.OnTopOutEvent ] = this._dispatchEvent( nodeID, "onTopOut" );
					continue;
				}
			}

			// Element in viewport
			if ( controlTable[ offset + IONodeData.InViewport ] && controlTable[ offset + IONodeData.OnViewportEvent ] ){
				const normalizedViewPosition = this._getNormalizedPosition( elementTop, elementBottom, scrollY, viewportHeight );
				this._renderEvent( nodeID, normalizedViewPosition );
			}

		}

		// Run remove action seperately to do not confuse _controlTable iteration
		this._removeNodeByIds( nodesToRemove );
	}

	/**
	 * @param elementTop Element top position Y (not relative to scroll)
	 * @param elementBottom Element bottom position Y (not relative to scroll)
	 * @param scrollY Current scroll Y
	 * @param viewportHeight Viewport height
	 * @returns +1 to -1, while element in viewport
	 * 
	 * @internal
	 */
	private _getNormalizedPosition( elementTop: number, elementBottom: number, scrollY: number, viewportHeight: number )
	{
		const elementHeight = elementBottom - elementTop;

		const normalizedWithOffset = ( 2 * ( elementBottom - scrollY ) / ( viewportHeight + elementHeight ) ) - 1;
		return normalizedWithOffset;
	}

	/**
	 * User is SCROLLING UP.
	 * Only "top-in" and "bottom-out" are possible.
	 * 
	 * @param scrollY Current scrollY value (window.scrollY) to calculate top (scrollY)
	 * @param viewportHeight Current viewportHeight to calculate bottom (scrollY + viewportHeight)
	 * 
	 * @internal
	 */
	private _handleScrollUp( scrollY: number, viewportHeight: number ): void
	{
		const nodesToRemove: number[] = [];
		const controlTable = this._controlTable.table;

		for ( let i = 0; i < this._controlTable.usedSlots; i++ ){

			const offset = i * this._controlTable.stride;
			const nodeID = controlTable[ offset + IONodeData.NodeID ];
			const elementTop = controlTable[ offset + IONodeData.NodeStart ];
			const elementBottom = controlTable[ offset + IONodeData.NodeEnd ];

			/**
			 * @note
			 * We need to track every in-out events, even the node hasn't a dispatcher on these events, 
			 * to switch between possible events for fast calculation.
			 * 
			 * "bottomIn" and "topOut" events seperately recorded to understand a "fast forward". 
			 * Check topIn then bottomOut.
			 */
			let topIn = 0;
			let bottomOut = 0;

			if ( controlTable[ offset + IONodeData.TrackTopIn ] && elementBottom > scrollY ){
				topIn = 1;
				// Activate "top-out", "bottom-out"
				this._controlTable.modifySlotByPosition( i, {
					[ IONodeData.InViewport ]: 1,
					[ IONodeData.TrackTopIn ]: 0,
					[ IONodeData.TrackTopOut ]: 1,
					[ IONodeData.TrackBottomIn ]: 0,
					[ IONodeData.TrackBottomOut ]: 1,
				} );
			}
			if ( controlTable[ offset + IONodeData.TrackBottomOut ] && elementTop > ( scrollY + viewportHeight ) ){
				bottomOut = 1;
				// Activate "bottom-in"
				this._controlTable.modifySlotByPosition( i, {
					[ IONodeData.InViewport ]: 0,
					[ IONodeData.TrackTopIn ]: 0,
					[ IONodeData.TrackTopOut ]: 0,
					[ IONodeData.TrackBottomIn ]: 1,
					[ IONodeData.TrackBottomOut ]: 0,
				} );
			}

			// Element fast-forwarded (bottom-in then top-out, jumpy scroll)
			if ( topIn && bottomOut ){

				if ( controlTable[ offset + IONodeData.OnFastForward ] !== FastForwardData.SkipBoth ){
					switch( controlTable[ offset + IONodeData.OnFastForward ] ){
						case FastForwardData.ExecuteLast: {
							if ( controlTable[ offset + IONodeData.OnBottomOutEvent ] ){
								controlTable[ offset + IONodeData.OnBottomOutEvent ] = this._dispatchEvent( nodeID, "onBottomOut" );
							}
							break;
						}
						case FastForwardData.ExecuteBoth: {
							if ( controlTable[ offset + IONodeData.OnTopInEvent ] ){
								controlTable[ offset + IONodeData.OnTopInEvent ] = this._dispatchEvent( nodeID, "onTopIn" );
							}
							if ( controlTable[ offset + IONodeData.OnBottomOutEvent ] ){
								controlTable[ offset + IONodeData.OnBottomOutEvent ] = this._dispatchEvent( nodeID, "onBottomOut" );
							}
							break;
						};
					}
				}

				continue;

			} else {
				if ( controlTable[ offset + IONodeData.OnTopInEvent ] && topIn ){
					controlTable[ offset + IONodeData.OnTopInEvent ] = this._dispatchEvent( nodeID, "onTopIn" );
				}
				if ( controlTable[ offset + IONodeData.OnBottomOutEvent ] && bottomOut ){
					controlTable[ offset + IONodeData.OnBottomOutEvent ] = this._dispatchEvent( nodeID, "onBottomOut" );
				}
			}

			// Element in viewport
			if ( controlTable[ offset + IONodeData.OnViewportEvent ] && controlTable[ offset + IONodeData.InViewport ] ){
				const normalizedViewPosition = this._getNormalizedPosition( elementTop, elementBottom, scrollY, viewportHeight );
				this._renderEvent( nodeID, normalizedViewPosition );
			}

		}

		// Run remove action seperately to do not confuse _controlTable iteration
		this._removeNodeByIds( nodesToRemove );
	}

	/**
	 * Executes onInViewport() method
	 * 
	 * @param nodeID Node internal id
	 * @param normalizedViewPosition -1 | 0 | +1
	 * 
	 * @internal
	 */
	private _renderEvent( nodeID: number, normalizedViewPosition: number )
	{
		// Function will be executed if only the node has onInViewport event
		const nodeSettings = this._nodes.get( nodeID )!;
		nodeSettings.dispatch.onInViewport!( normalizedViewPosition );
	}

	/**
	 * Dispatch defined Node function for given event.
	 * Function will be executed if only the node has a listener on given event
	 * 
	 * @param nodeID Node id
	 * @param event Dispatched event
	 * @returns 1 | 0 if node needs to be deleted
	 * 
	 * @internal
	 */
	private _dispatchEvent( nodeID: number, event: IOVerticalEvent ): number
	{
		const ioNodeOptions = this._nodes.get( nodeID )!;

		if ( "limit" in ioNodeOptions.dispatch[ event ]! ){
			ioNodeOptions.dispatch[ event ].dispatch();
			ioNodeOptions.dispatch[ event ].limit -= 1;
			return ioNodeOptions.dispatch[ event ].limit < 1 ? 0 : 1;
		} else {
			ioNodeOptions.dispatch[ event ]!();
			return 1;
		}

	}

}