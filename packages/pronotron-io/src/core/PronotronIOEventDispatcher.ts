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
 */
type EventFlagIndex = IONodeStrideIndex.HasNegativeEnterEvent | IONodeStrideIndex.HasNegativeExitEvent | IONodeStrideIndex.HasPositiveEnterEvent | IONodeStrideIndex.HasPositiveExitEvent; 

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
				this._triggerEvent( 
					offset, 
					nodeID, 
					IONodeStrideIndex.HasNegativeExitEvent, 
					this._eventNames._negativeExitEvent 
				);
			},
			[ IONodePosition.InPositiveArea ]: ( offset: number, nodeID: number ) => {
				// Trigger positive-exit
				this._triggerEvent( 
					offset, 
					nodeID, 
					IONodeStrideIndex.HasPositiveExitEvent, 
					this._eventNames._positiveExitEvent 
				);
			}
		},
		// Was previosly in negative area, "negative-enter" and "fast-forward" are possible
		[ IONodePosition.InNegativeArea ]: {
			[ IONodePosition.InViewport ]: ( offset: number, nodeID: number ) => {
				// Trigger negative-enter
				this._triggerEvent( 
					offset, 
					nodeID, 
					IONodeStrideIndex.HasNegativeEnterEvent, this._eventNames._negativeEnterEvent 
				);
			},
			[ IONodePosition.InPositiveArea ]: ( offset: number, nodeID: number ) => {
				// Trigger fast-forward (negative-enter then positive-exit)
				this._resolveFastForward( 
					offset, 
					nodeID, 
					IONodeStrideIndex.HasNegativeEnterEvent, this._eventNames._negativeEnterEvent, 
					IONodeStrideIndex.HasPositiveExitEvent, this._eventNames._positiveExitEvent  
				);
			},
		},
		// Was previosly in positive area, "positive-enter" and "fast-forward" are possible
		[ IONodePosition.InPositiveArea ]: {
			[ IONodePosition.InViewport ]: ( offset: number, nodeID: number ) => {
				// Trigger positive-enter
				this._triggerEvent( 
					offset, 
					nodeID, 
					IONodeStrideIndex.HasPositiveEnterEvent, this._eventNames._positiveEnterEvent 
				);
			},
			[ IONodePosition.InNegativeArea ]: ( offset: number, nodeID: number ) => {
				// Trigger fast-forward (positive-enter then negative-exit)
				this._resolveFastForward( 
					offset, 
					nodeID, 
					IONodeStrideIndex.HasPositiveEnterEvent, this._eventNames._positiveEnterEvent,
					IONodeStrideIndex.HasNegativeExitEvent, this._eventNames._negativeExitEvent
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
		this._lastScrollValue = scrollValue;
		this._updateActualIntersection();
		this._handlePositions();
		return;
	}

	/**
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

				// Update the node’s position in the control table
				this._controlTable.modifyByPosition( i, {
					[ IONodeStrideIndex.LastPosition ]: currentPosition,
					[ IONodeStrideIndex.InViewport ]: currentPosition === IONodePosition.InViewport ? 1 : 0,
				} );

			}

			// Execute the in-viewport event if available
			if ( table[ offset + IONodeStrideIndex.HasInViewportEvent ] && table[ offset + IONodeStrideIndex.InViewport ] ){
				const normalizedViewPosition = this._getNormalizedPosition( elementStart, elementEnd, this._lastScrollValue, this._viewportSize );
				this._executeInViewportCallback( nodeID, normalizedViewPosition );
			}

		}
	}

	/**
	 * Triggers an event for an IONode, if one exists.
	 *
	 * @param offset - The IONode’s offset in the control table.
	 * @param nodeID - The IONode’s internal ID.
	 * @param eventCheck - The event flag index within the stride.
	 * @param event - The human-readable event name.
	 *
	 * @internal
	 */
	private _triggerEvent( offset: number, nodeID: number, eventCheck: EventFlagIndex, event: TEvents ): void
	{
		const controlTable = this._controlTable.table;

		if ( controlTable[ offset + eventCheck ] ){
			controlTable[ offset + eventCheck ] = this._dispatchEvent( nodeID, event );
		}
	}
	
	/**
	 * Resolves a fast-forward scenario by dispatching the appropriate events.
	 *
	 * @param offset - The IONode’s offset in the control table.
	 * @param nodeID - The IONode’s internal ID.
	 * @param firstEventCheck - The flag index of the first event.
	 * @param firstEvent - The human-readable name of the first event.
	 * @param lastEventCheck - The flag index of the last event.
	 * @param lastEvent - The human-readable name of the last event.
	 *
	 * @internal
	 */
	private _resolveFastForward( 
		offset: number, 
		nodeID: number, 
		firstEventCheck: EventFlagIndex, firstEvent: TEvents,  
		lastEventCheck: EventFlagIndex, lastEvent: TEvents
	): void
	{
		const fastForwardType = this._controlTable.table[ offset + IONodeStrideIndex.OnFastForward ];

		if ( fastForwardType === FastForwardStrategy.SkipBoth ){
			return;
		}

		switch( fastForwardType )
		{
			case FastForwardStrategy.ExecuteLast: {
				this._triggerEvent( offset, nodeID, lastEventCheck, lastEvent );
				break;
			};
			case FastForwardStrategy.ExecuteBoth: {
				this._triggerEvent( offset, nodeID, firstEventCheck, firstEvent );
				this._triggerEvent( offset, nodeID, lastEventCheck, lastEvent );
				break;
			};
		}
	}

	/**
	 * Calculates the normalized position of an element within the viewport.
	 *
	 * @param elementStart - The element’s starting position (absolute, not relative to scroll).
	 * @param elementEnd - The element’s ending position (absolute, not relative to scroll).
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
		//@ts-expect-error - _renderEvent() will be executed if only the IONode has onInViewport event
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