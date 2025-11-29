import { PointerState, PointerBase, BaseSettings } from "../interaction/PointerBase";
import { PointerHoldable, HoldableSettings } from "../interaction/PointerHoldable";

/**
 * Common methods between models
 */
export abstract class ModelController
{
	/**
	 * Every pointer model has its own event listener starters
	 * @internal
	 */
	protected abstract _startEvents(): void;
	/**
	 * Every pointer model has its own event listener stoppers
	 * @internal
	 */
	protected abstract _stopEvents(): void;
	/**
	 * Every pointer model has its own pointer position getter model
	 * @internal
	 */
	protected abstract _getPointerPosition( event: MouseEvent | TouchEvent ): { x: number; y: number };
	
	/**
	 * The underlying pointer model instance used by this controller.
	 * @internal
	 */
	protected readonly _model: PointerBase | PointerHoldable;
	
	/**
	 * True while event listeners are active
	 * @internal
	 */
	private _isRunning: boolean = false;

	/**
	 * Creates an instance of the ModelController with the provided model.
	 *
	 * @param model - The pointer model to be controlled. Can be either a `PointerBase` or a `PointerHoldable`.
	 */
	constructor( model: PointerBase | PointerHoldable )
	{
		this._model = model;
	}

	/**
	 * Start listening for pointer events and initialize the pointer state.
	 *
	 * If the controller is already running, this method is a no-op and logs a warning.
	 * Otherwise, it attaches the event handlers, sets the model's current state to
	 * PointerState.IDLE, and marks the controller as running.
	 */
	startEvents(): boolean
	{
		if ( this._isRunning ){
			console.warn( 'PronotronPointer: Already started.' );
			return false;
		}

		this._startEvents();

		this._isRunning = true;
		return true;
	}

	/**
	 * Stops and removes all registered event listeners.
	 * Should be called during cleanup or disposal.
	 */
	stopEvents(): void
	{
		this._stopEvents();

		// Reset state
		this._model.pointerTarget = null;
		this._model._currentState = PointerState.IDLE;
		this._isRunning = false;
	}

	/**
	 * Updates settings of the pointer controller
	 * @param settings 
	 */
	updateSettings( settings: BaseSettings | HoldableSettings ): void
	{
		//@ts-expect-error - Property 'holdThreshold' is missing in type 'BaseSettings'
		this._model._updateSettings( settings );
	}

	/**
	 * Returns the current pointer state as a human-readable string,
	 * e.g. "IDLE", "MOVING".
	 *
	 * @returns Current state name from {@link PointerState}.
	 */
	getState(): string
	{
		// @tip - Causes ENUM to be a constant in the build code
		return PointerState[ this._model._currentState ];
	}

	/**
	 * Indicates whether the element currently under the pointer, satisfies the user-supplied {@link _isInteractable} check.
	 *
	 * @returns True if the active event target is interactable.
	 */
	canInteract(): boolean
	{
		return this._model._canInteract;
	}

	/**
	 * Latest pointer coordinates in screen pixels.
	 *
	 * @returns Object with `{ x, y }` screen coordinates.
	 */
	getPosition(): { x: number; y: number; }
	{
		/**
		 * PointerEnd is always equal to PointerStart. But PointerStart might be different than PointerEnd.
		 * Return PointerStart.
		 */
		return this._model._pointerStart;
	}

	/**
	 * Pixel delta of the pointer since the previous update.
	 *
	 * @returns Object with `{ x, y }` movement in pixels.
	 */
	getDelta(): { x: number; y: number; }
	{
		return this._model._pointerDelta;
	}

	/**
	 * Accumulated the total delta registered from pointer events. 
	 * This serves as the target position for the
	 * easing/inertia/glide mechanism.
	 * 
	 * @returns Object with `{ x, y }` delta in pixels.
	 */
	getDeltaAdditive(): { x: number; y: number; }
	{
		return this._model._pointerDeltaAdditive;
	}
}