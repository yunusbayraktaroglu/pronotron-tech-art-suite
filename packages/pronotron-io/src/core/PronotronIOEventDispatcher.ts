import type { BinaryBoolean } from "@pronotron/utils";
import { 
	PronotronIOBase, 
	IONodeStrideIndex, 
	FastForwardStrategy, 
	IONodePosition
} from "./PronotronIOBase";

type ValidNodePosition = Exclude<IONodePosition, IONodePosition.NotReady>;
type EventMap = Record<ValidNodePosition, Partial<Record<ValidNodePosition, ( offset: number, nodeID: number ) => void>>>;

/**
 * Index of event flags within the stride.
 * Value is a {@link BinaryBoolean} to represent exist or not.
 */
type EventFlagIndex = IONodeStrideIndex.HasNegativeEnterEvent | IONodeStrideIndex.HasNegativeExitEvent | IONodeStrideIndex.HasPositiveEnterEvent | IONodeStrideIndex.HasPositiveExitEvent | IONodeStrideIndex.HasEnterEvent | IONodeStrideIndex.HasExitEvent; 

export abstract class PronotronIOEventDispatcher<TEvents extends string> extends PronotronIOBase<TEvents>
{
	/**
	 * Maps position transitions (previous → current) to their corresponding event handlers.
	 * {@link IONodePosition}
	 * 
	 * @internal
	 */
	private _transitionHandlers: EventMap = {
		// Was previosly in the viewport, "negative-exit" and "positive-exit" are possible
		[ IONodePosition.InViewport ]: {
			[ IONodePosition.InNegativeArea ]: ( offset: number, nodeID: number ) => {
				// Trigger negative-exit
				this._triggerEvent( offset, nodeID, IONodeStrideIndex.HasNegativeExitEvent, this._eventNames._negativeExitEvent );
				// Trigger onExit
				this._triggerEvent( offset, nodeID, IONodeStrideIndex.HasExitEvent, "onExit" as TEvents );
			},
			[ IONodePosition.InPositiveArea ]: ( offset: number, nodeID: number ) => {
				// Trigger positive-exit
				this._triggerEvent( offset, nodeID, IONodeStrideIndex.HasPositiveExitEvent, this._eventNames._positiveExitEvent );
				// Trigger onExit
				this._triggerEvent( offset, nodeID, IONodeStrideIndex.HasExitEvent, "onExit" as TEvents );
			}
		},
		// Was previosly in negative area, "negative-enter" and "fast-forward" are possible
		[ IONodePosition.InNegativeArea ]: {
			[ IONodePosition.InViewport ]: ( offset: number, nodeID: number ) => {
				// Trigger negative-enter
				this._triggerEvent( offset, nodeID, IONodeStrideIndex.HasNegativeEnterEvent, this._eventNames._negativeEnterEvent );
				// Trigger onEnter
				this._triggerEvent( offset, nodeID, IONodeStrideIndex.HasEnterEvent, "onEnter" as TEvents );
			},
			[ IONodePosition.InPositiveArea ]: ( offset: number, nodeID: number ) => {
				// Trigger fast-forward (negative-enter then positive-exit)
				this._resolveFastForward( 
					offset, 
					nodeID, 
					IONodeStrideIndex.HasNegativeEnterEvent,
					this._eventNames._negativeEnterEvent, 
					IONodeStrideIndex.HasPositiveExitEvent,
					this._eventNames._positiveExitEvent  
				);
			},
		},
		// Was previosly in positive area, "positive-enter" and "fast-forward" are possible
		[ IONodePosition.InPositiveArea ]: {
			[ IONodePosition.InViewport ]: ( offset: number, nodeID: number ) => {
				// Trigger positive-enter
				this._triggerEvent( offset, nodeID, IONodeStrideIndex.HasPositiveEnterEvent, this._eventNames._positiveEnterEvent );
				// Trigger onEnter
				this._triggerEvent( offset, nodeID, IONodeStrideIndex.HasEnterEvent, "onEnter" as TEvents );
			},
			[ IONodePosition.InNegativeArea ]: ( offset: number, nodeID: number ) => {
				// Trigger fast-forward (positive-enter then negative-exit)
				this._resolveFastForward( 
					offset, 
					nodeID, 
					IONodeStrideIndex.HasPositiveEnterEvent, 
					this._eventNames._positiveEnterEvent,
					IONodeStrideIndex.HasNegativeExitEvent,
					this._eventNames._negativeExitEvent
				);
			},
		},
	}

	/**
	 * Handles scroll events and updates the current scroll direction,
	 * then recalculates intersections.
	 * 
	 * @param scrollValue Current scroll value
	 */
	handleScroll( scrollValue: number ): void 
	{
		this.direction = ( scrollValue > this._lastScrollValue ) ? this._scrollDirectionNames._negative : this._scrollDirectionNames._positive;
		this.setLastScroll( scrollValue );
		this._handlePositions();
	}

	/**
	 * With each handleScroll() execution by user,
	 * loops through internal control table and modifies their states, triggers events if needed
	 * 
	 * @internal
	 */
	private _handlePositions(): void
	{
		const { table, stride, usedSlots } = this._controlTable;

		for ( let i = 0; i < usedSlots; i++ ){

			const offset = i * stride;

			const nodeID = table[ offset + IONodeStrideIndex.ID ];
			const elementStart = table[ offset + IONodeStrideIndex.StartPosition ];
			const elementEnd = table[ offset + IONodeStrideIndex.EndPosition ];
			const previousPosition = table[ offset + IONodeStrideIndex.LastPosition ] as IONodePosition;

			const currentPosition = this._calculatePosition( elementStart, elementEnd );

			// Triggers related event if IONode's position has changed
			if ( previousPosition !== currentPosition ){

				if ( previousPosition !== IONodePosition.NotReady ){
					this._transitionHandlers[ previousPosition ][ currentPosition ]!( offset, nodeID );
				}

				// Update the node's position in the control table
				this._controlTable.modifyByPosition( i, {
					[ IONodeStrideIndex.LastPosition ]: currentPosition,
					[ IONodeStrideIndex.InViewport ]: currentPosition === IONodePosition.InViewport ? 1 : 0,
				} );

			}

			// Execute the in-viewport event if available
			if ( table[ offset + IONodeStrideIndex.InViewport ] ){

				if ( table[ offset + IONodeStrideIndex.HasInViewportEvent ] ){
					const normalizedViewPosition = this._getNormalizedPosition( elementStart, elementEnd, this._lastScrollValue, this._viewportSize );
					this._executeInViewportCallback( nodeID, normalizedViewPosition );
				}

				if ( table[ offset + IONodeStrideIndex.HasScrollProgressEvent ] ){
					const scrollProgress = this._getScrollProgress( elementStart, elementEnd, this._lastScrollValue, this._viewportSize );
					this._executeOnScrollProgressCallback( nodeID, scrollProgress );
				}

			}

		}
	}

	/**
	 * Triggers an event for an IONode, if one exists.
	 *
	 * @param offset - The IONode's offset in the control table.
	 * @param nodeID - The IONode's internal ID.
	 * @param eventFlag - The event flag index within the stride.
	 * @param eventName - The human-readable event name.
	 *
	 * @internal
	 */
	private _triggerEvent( offset: number, nodeID: number, eventFlag: EventFlagIndex, eventName: TEvents ): void
	{
		const controlTable = this._controlTable.table;

		if ( controlTable[ offset + eventFlag ] ){
			controlTable[ offset + eventFlag ] = this._dispatchEvent( nodeID, eventName );
		}
	}
	
	/**
	 * Resolves a fast-forward scenario by dispatching the appropriate events.
	 *
	 * @param offset - The IONode's offset in the control table.
	 * @param nodeID - The IONode's internal ID.
	 * @param firstEventFlag - The flag index of the first event.
	 * @param firstEventName - The human-readable name of the first event.
	 * @param lastEventFlag - The flag index of the last event.
	 * @param lastEventName - The human-readable name of the last event.
	 *
	 * @internal
	 */
	private _resolveFastForward( 
		offset: number, 
		nodeID: number, 
		firstEventFlag: EventFlagIndex, 
		firstEventName: TEvents,  
		lastEventFlag: EventFlagIndex, 
		lastEventName: TEvents
	): void
	{
		const fastForwardType = this._controlTable.table[ offset + IONodeStrideIndex.OnFastForward ];

		if ( fastForwardType === FastForwardStrategy.SkipBoth ){
			return;
		}

		switch( fastForwardType )
		{
			case FastForwardStrategy.ExecuteLast: {
				this._triggerEvent( offset, nodeID, lastEventFlag, lastEventName );
				break;
			};
			case FastForwardStrategy.ExecuteBoth: {
				this._triggerEvent( offset, nodeID, firstEventFlag, firstEventName );
				this._triggerEvent( offset, nodeID, lastEventFlag, lastEventName );
				break;
			};
		}
	}

	/**
	 * Calculates the normalized position of an element within the viewport.
	 *
	 * @param elementStart - The element's starting position (absolute, not relative to scroll).
	 * @param elementEnd - The element's ending position (absolute, not relative to scroll).
	 * @param scrollValue - The current scroll value.
	 * @param viewportSize - The size of the viewport.
	 * @returns A value between -1 and +1 while the element is inside the viewport.
	 *
	 * @internal
	 */
	private _getNormalizedPosition( elementStart: number, elementEnd: number, scrollValue: number, viewportSize: number ): number
	{
		const elementSize = elementEnd - elementStart;
		const normalizedWithOffset = ( 2 * ( elementEnd - scrollValue ) / ( viewportSize + elementSize ) ) - 1;
		
		return normalizedWithOffset;
	}

	/**
	 * Calculates the percentage of an element that has been scrolled into the viewport.
	 * - 0% is achieved when the element's top edge aligns with the viewport bottom.
	 * - 100% is achieved when the element's bottom edge aligns with the viewport bottom
	 *
	 * @param elementStart The absolute vertical position of the element's top edge (from the document top).
	 * @param elementEnd The absolute vertical position of the element's bottom edge (from the document top).
	 * @param scrollValue The vertical scroll position of the window (window.scrollY).
	 * @param viewportSize The height of the visible viewport (window.innerHeight).
	 * @returns The scroll percentage (0 to 100).
	 */
	private _getScrollProgress( elementStart: number, elementEnd: number, scrollValue: number, viewportSize: number ): number
	{
		// The bottom of the viewport relative to the document
		const viewportBottom = scrollValue + viewportSize;

		// 1. Calculate the distance between the 0% point and the 100% point.
		// The 0% point is when V_Bottom hits elementStart.
		// The 100% point is when V_Bottom hits elementEnd.
		const elementSize = elementEnd - elementStart;
		
		// Total travel distance for 0% to 100% is the element's height.
		const totalTravelDistance = elementSize;

		// Edge case: If the element has no height, return 0 or 100 depending on its position
		if ( totalTravelDistance <= 0 ){
			return viewportBottom > elementEnd ? 1 : 0;
		}

		// 2. Calculate the distance scrolled into the element (Current Progress)
		// Progress starts when viewportBottom hits elementStart (Progress = 0)
		const currentProgress = viewportBottom - elementStart;

		// 3. Calculate the percentage
		let percentage = currentProgress / totalTravelDistance;

		// 4. Clamp the value between 0 and 1
		percentage = Math.max( 0, Math.min( 1, percentage ) );

		return percentage;
	}

	private _executeOnScrollProgressCallback( nodeID: number, scrollProgress: number ): void
	{
		const nodeSettings = this._nodes.get( nodeID );
		//@ts-expect-error - _executeReachCallback() will be executed if only the IONode has onReach event
		nodeSettings.dispatch.onScrollProgress( scrollProgress );
	}

	/**
	 * Executes the `onInViewport()` callback for the node, if defined.
	 *
	 * @param nodeID - The node’s internal ID.
	 * @param normalizedViewPosition - A value in the range [-1, 1] representing the element’s position in the viewport.
	 *
	 * @internal
	 */
	private _executeInViewportCallback( nodeID: number, normalizedViewPosition: number ): void
	{
		const nodeSettings = this._nodes.get( nodeID );
		//@ts-expect-error - _executeInViewportCallback() will be executed if only the IONode has onInViewport event
		nodeSettings.dispatch.onInViewport( normalizedViewPosition );
	}

	/**
	 * Dispatches the function defined for a given event.
	 * The function executes only if the node has a listener for that event.
	 *
	 * @param nodeID - The node’s internal ID.
	 * @param event - The human-readable event name.
	 * @returns 1 if the node should remain active, or 0 if it should be removed.
	 *
	 * @internal
	 */
	private _dispatchEvent( nodeID: number, event: TEvents ): BinaryBoolean
	{
		const nodeSettings = this._nodes.get( nodeID )!;
		const handler = nodeSettings.dispatch[ event ]!;

		if ( "limit" in handler ){
			handler.dispatch();
			handler.limit -= 1;
			return handler.limit < 1 ? 0 : 1;
		} else {
			handler();
			return 1;
		}
	}

}