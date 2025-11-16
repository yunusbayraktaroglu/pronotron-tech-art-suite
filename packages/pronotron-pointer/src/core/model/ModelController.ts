import { PointerState, PointerBase, BaseSettings } from "../interaction/PointerBase";
import { PointerHoldable, HoldableSettings } from "../interaction/PointerHoldable";

/**
 * Common methods between models
 */
export abstract class ModelController
{
	/**
	 * Possible models
	 * @internal
	 */
	readonly _model: PointerBase | PointerHoldable;

	/**
	 * Every pointer model has its own pointer position getter model
	 * @internal
	 */
	abstract _getPointerPosition( event: MouseEvent | TouchEvent ): { x: number; y: number }

	constructor( model: PointerBase | PointerHoldable )
	{
		this._model = model;
	}

	/**
	 * Updates settings of the pointer controller
	 * @param settings 
	 */
	updateSettings( settings: BaseSettings | HoldableSettings ): void
	{
		//@ts-expect-error - Property 'holdThreshold' is missing in type 'BaseSettings', harmless warning.
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