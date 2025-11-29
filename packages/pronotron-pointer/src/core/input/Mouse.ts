import { ModelController } from "../model/ModelController";
import { PointerState } from "../interaction/PointerBase";

/**
 * MouseController
 *
 * Handles mouse-based pointer interactions.
 */
export class MouseController extends ModelController
{
	/**
	 * Prevents the extra `pointermove` event that the browser fires
	 * immediately after `pointerup`. Used only for mouse input.
	 *
	 * @internal
	 */
	private _skipMove = false;

	/**
	 * Starts listening for mouse-related pointer events.
	 * Must be called before interaction can be tracked.
	 * 
	 * @abstract
	 * @internal
	 */
	protected _startEvents(): void
	{
		this._model._addEventListeners(
			[ "pointerdown", this._onPointerStart ],
			[ "pointermove", this._onPointerMove ],
			[ "pointerleave", this._onPointerLeave ],
			[ "dragstart", this._onDragStart ],
		);
	}

	/**
	 * Stops and removes all registered mouse event listeners.
	 * Should be called during cleanup or disposal.
	 * 
	 * @abstract
	 * @internal
	 */
	protected _stopEvents(): void
	{
		this._model._removeEventListeners(
			[ "pointerdown", this._onPointerStart ],
			[ "pointermove", this._onPointerMove ],
			[ "pointerup", this._onPointerEnd ],
			[ "pointercancel", this._onPointerEnd ],
			[ "pointerleave", this._onPointerLeave ],
			[ "dragstart", this._onDragStart ],
			[ "dragover", this._onPointerMove ],
			[ "dragend", this._onDragEnd ],
		);
	}

	/**
	 * Extracts pointer coordinates from a {@link MouseEvent}.
	 *
	 * @param event - Native mouse event
	 * @returns The pointer’s x and y position in client coordinates
	 * 
	 * @abstract
	 * @internal
	 */
	protected _getPointerPosition( event: MouseEvent ): { x: number; y: number }
	{
		return { 
			x: event.clientX,
			y: event.clientY
		};
	}

	/**
	 * Handles `pointerdown`:
	 * - Registers corresponding `pointerup` and `pointercancel` listeners.
	 * - Delegates to the base model’s `_onPointerStart`.
	 *
	 * @internal
	 */
	_onPointerStart = ( event: MouseEvent ): void =>
	{
		this._model._addEventListeners(
			[ "pointerup", this._onPointerEnd ],
			[ "pointercancel", this._onPointerEnd ],
		);
		this._model._onPointerStart( event );
	};

	/**
	 * Handles `pointerup` and `pointercancel`:
	 * - Removes temporary listeners.
	 * - Skips spurious `pointermove` events that occur after release.
	 * - Respects drag state (prevents incorrect state changes).
	 *
	 * @internal
	 */
	_onPointerEnd = ( event: MouseEvent ): void =>
	{
		/**
		 * Skip onMove caused by onEnd. {@link _skipMove}
		 */
		this._skipMove = true;

		this._model._removeEventListeners(
			[ "pointerup", this._onPointerEnd ],
			[ "pointercancel", this._onPointerEnd ],
		);

		// Native 'dragstart' event releases pointerdown, return early without changing state
		if ( this._model._currentState === PointerState.DRAGGING ){
			return;
		}

		this._model._onPointerEnd( event );
	};

	/**
	 * Handles `pointermove`:
	 * - Updates the pointer position.
	 * - Skips the synthetic move event triggered after release.
	 * - Switches state from `OUTSIDE` → `MOVING` if needed.
	 * - Delegates to the base model’s `_onPointerMove`.
	 *
	 * @internal
	 */
	_onPointerMove = ( event: MouseEvent ): void =>
	{
		/**
		 * Skip onMove caused by onEnd. {@link _skipMove}
		 */
		if ( this._skipMove ){
			this._skipMove = false;
			return;
		};

		const { x, y } = this._getPointerPosition( event );

		// Reset start-end position to get correct delta value, if previously OUTSIDE
		if ( this._model._currentState === PointerState.OUTSIDE ){

			this._model._pointerStart.set( x, y );
			this._model._pointerEnd.set( x, y );
			
			this._model._currentState = PointerState.MOVING;

		}

		this._model._updatePointer( x, y );

		// Native dragging is connected to _onPointerMove, we only updating the pointer position
		if ( this._model._currentState === PointerState.DRAGGING ){
			return;
		}

		this._model._onPointerMove( event );
	};

	/**
	 * Handles `pointerleave`:
	 * - Ends interaction if dragging with hold.
	 * - Updates state to `OUTSIDE`.
	 *
	 * @internal
	 */
	_onPointerLeave = ( event: MouseEvent ): void =>
	{
		if ( this._model._currentState === PointerState.HOLD_DRAGGING ){
			this._model._onPointerEnd( event );
		}
		
		this._model._currentState = PointerState.OUTSIDE;
	};

	/**
	 * Handles `dragstart`:
	 * - Registers drag-related listeners (`dragover`, `dragend`).
	 * - Updates state to `DRAGGING`.
	 *
	 * @internal
	 */
	_onDragStart = (): void =>
	{
		this._model._addEventListeners(
			[ "dragover", this._onPointerMove ],
			[ "dragend", this._onDragEnd ],
		);
		this._model._currentState = PointerState.DRAGGING;
	};

	/**
	 * Handles `dragend`:
	 * - Removes drag-related listeners.
	 * - Resets state to `IDLE`.
	 *
	 * @internal
	 */
	_onDragEnd = (): void =>
	{
		this._model._removeEventListeners(
			[ "dragover", this._onPointerMove ],
			[ "dragend", this._onDragEnd ],
		);
		this._model._currentState = PointerState.IDLE;
	};
}