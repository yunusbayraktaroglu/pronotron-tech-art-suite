import { PointerState, PointerBase, PointerBaseDependencies, BaseSettings } from "../PointerBase";
import { PointerHoldable, PointerHoldableDependencies, HoldableSettings } from "../PointerHoldable";

/**
 * Common methods between models
 */
export abstract class ModelController
{
	/**
	 * Possible models
	 * @internal
	 */
	_model: PointerBase | PointerHoldable;

	/**
	 * Every pointer model has its own pointer position getter model
	 * @internal
	 */
	abstract _getPointerPosition( event: MouseEvent | TouchEvent ): { x: number; y: number }

	constructor( dependencies: PointerBaseDependencies | PointerHoldableDependencies )
	{
		this._model = ( "holdThreshold" in dependencies ) ? new PointerHoldable( dependencies ) : new PointerBase( dependencies ); 
	}

	/**
	 * Updates settings of the pointer controller
	 * @param settings 
	 */
	updateSettings( settings: BaseSettings | HoldableSettings ): void
	{
		/**
		 * @todo
		 * Find a better way
		 */
		for ( const [ key, value ] of Object.entries( settings ) ){
			const internalKey = `_${ key }` as keyof this[ "_model" ];
			if ( internalKey in this._model ){
				( this._model as any )[ internalKey ] = value;
			}
		}
		// console.log( this._model );
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

}