import { 
	IOEvent,
	ViewportProps,
} from "../../types/global";
import { 
	NodeData 
} from "./PronotronIOControlTable";
import { PronotronIOBase } from "./PronotronIOBase";


export class PronotronIOScroller extends PronotronIOBase
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
		if ( scrollY == this._lastScrollY ) return;

		if ( scrollY > this._lastScrollY ){
			this.direction = "down";
			this.#handleScrollDown( scrollY, this._viewport!._screenHeight );
		} else {
			this.direction = "up";
			this.#handleScrollUp( scrollY, this._viewport!._screenHeight );
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
		const controlTable = this._controlTable.table;

		for ( let i = 0; i < this._nodes.size; i++ ){

			let offset = i * this._controlTable.nodeDataSize;

			let nodeID = controlTable[ offset + NodeData.NodeID ];
			let elementY = controlTable[ offset + NodeData.NodeYPosition ];

			// bottom-in
			if ( controlTable[ offset + NodeData.BottomIn ] && elementY < ( scrollY + viewportHeight ) ){
				if ( this.#dispatchEvent( nodeID, "bottom-in" ) ){
					nodesToRemove.push( nodeID );
					continue;
				} else {
					// Activate "top-out", "bottom-out"
					this._controlTable.updateTrackingData( offset, 0, 1, 0, 1 );
				}
			}

			// top-out
			if ( controlTable[ offset + NodeData.TopOut ] && elementY < scrollY ){
				if ( this.#dispatchEvent( nodeID, "top-out" ) ){
					nodesToRemove.push( nodeID );
					continue;
				} else {
					// Activate "top-in"
					this._controlTable.updateTrackingData( offset, 1, 0, 0, 0 );
				}
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
		const controlTable = this._controlTable.table;

		for ( let i = 0; i < this._nodes.size; i++ ){

			let offset = i * this._controlTable.nodeDataSize;

			let nodeID = controlTable[ offset + NodeData.NodeID ];
			let elementY = controlTable[ offset + NodeData.NodeYPosition ];

			// top-in
			if ( controlTable[ offset + NodeData.TopIn ] && elementY > scrollY ){
				if ( this.#dispatchEvent( nodeID, "top-in" ) ){
					nodesToRemove.push( nodeID );
					continue;
				} else {
					// Activate "top-out", "bottom-out"
					this._controlTable.updateTrackingData( offset, 0, 1, 0, 1 );
				}
			}

			// bottom-out
			if ( controlTable[ offset + NodeData.BottomOut ] && elementY > ( scrollY + viewportHeight ) ){
				if ( this.#dispatchEvent( nodeID, "bottom-out" ) ){
					nodesToRemove.push( nodeID );
					continue;
				} else {
					// Activate "bottom-in"
					this._controlTable.updateTrackingData( offset, 0, 0, 1, 0 );
				}
			}

		}

		// Run remove action seperately to do not confuse _controlTable iteration
		this._removeNodeByIds( nodesToRemove );
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