import { ModelController } from "../model/ModelController";

/**
 * TouchController
 *
 * Handles touch-based pointer.
 */
export class TouchController extends ModelController
{
	/**
	 * Starts listening for touch events.
	 * Must be called before interaction can be tracked.
	 * 
	 * @abstract
	 * @internal
	 */
	protected _startEvents()
	{
		this._model._addEventListeners(
			[ "touchstart", this._onPointerStart ],
		);
	}

	/**
	 * Stops and removes all registered touch event listeners.
	 * Should be called during cleanup or disposal.
	 * 
	 * @abstract
	 * @internal
	 */
	protected _stopEvents()
	{
		this._model._removeEventListeners(
			[ "touchstart", this._onPointerStart ],
			[ "touchmove", this._onPointerMove ],
			[ "touchend", this._onPointerEnd ],
		);
	}

	/**
	 * Extracts pointer coordinates from a {@link TouchEvent}.
	 *
	 * @param event - Native touch event
	 * @returns The pointer’s x and y position in client coordinates, based on the first active touch
	 *
	 * @abstract
	 * @internal
	 */
	protected _getPointerPosition( event: TouchEvent ): { x: number; y: number }
	{
		return { 
			x: event.touches[ 0 ].clientX, 
			y: event.touches[ 0 ].clientY 
		};
	}

	/**
	 * Handles `touchstart`:
	 * - Registers `touchmove` and `touchend` listeners.
	 * - Extracts and records the initial touch position.
	 * - Manually sets `_pointerStart` since touch does not automatically trigger pointerdown.
	 * - Delegates to the base model’s `_onPointerStart`.
	 *
	 * @internal
	 */
	protected _onPointerStart = ( event: TouchEvent ): void =>
	{
		this._model._addEventListeners(
			[ "touchmove", this._onPointerMove ],
			[ "touchend", this._onPointerEnd ],
		);

		const { x, y } = this._getPointerPosition( event );

		this._model._pointerStart.set( x, y );
		this._model._onPointerStart( event );
	};

	/**
	 * Handles `touchend`:
	 * - Removes temporary listeners (`touchmove`, `touchend`).
	 * - Delegates to the base model’s `_onPointerEnd`.
	 *
	 * @internal
	 */
	protected _onPointerEnd = ( event: TouchEvent ): void =>
	{
		this._model._removeEventListeners(
			[ "touchmove", this._onPointerMove ],
			[ "touchend", this._onPointerEnd ],
		);

		this._model._onPointerEnd( event );
	};

	/**
	 * Handles `touchmove`:
	 * - Updates the pointer position with the latest touch coordinates.
	 * - Delegates to the base model’s `_onPointerMove`.
	 *
	 * @internal
	 */
	protected _onPointerMove = ( event: TouchEvent ): void =>
	{
		const { x, y } = this._getPointerPosition( event );

		this._model._updatePointer( x, y );
		this._model._onPointerMove( event );
	};
}