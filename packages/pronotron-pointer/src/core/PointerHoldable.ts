import { PointerBase, CommonDependencies, PointerStates } from "./PointerBase";

export type PointerHoldableDependencies = CommonDependencies & {
	isHoldable: ( target: HTMLElement ) => boolean;
	holdTreshold: number;
};

export class PointerHoldable extends PointerBase<"hold" | "holdend">
{
	/** @internal */
	_isHoldable: ( target: HTMLElement ) => boolean;
	/** @internal */
	_holdedElement: HTMLElement | null = null;
	/** @internal */
	_holdThreshold = 0.35;

	constructor( dependencies: PointerHoldableDependencies )
	{
		super( dependencies );

		this._isHoldable = dependencies.isHoldable;
		this._holdThreshold = dependencies.holdTreshold;
	}

	/**
	 * Pointer events
	 * @internal
	 */
	_onPointerStart( event: MouseEvent ): void
	{
		if ( event.target && this._isHoldable( event.target as HTMLElement ) ){
			this._animationController.addAnimation({
				id: "HOLD",
				duration: this._holdThreshold,
				timeStyle: "continious",
				onEnd: ( forced ) => {
					if ( ! forced && this._currentState === PointerStates.WAITING ){
						this._convertToHold( event );
					}
				}
			});
		}
		
		super._onPointerStart( event );
	}

	/**
	 * In mouse, will fire onMove 1 time after onEnd.
	 * 
	 * Solution: onEnd can only fire, if interaction started (onStart).
	 * Add a prop to 1 onEnd, in onMove 1, disable it and continue
	 * 
	 * @internal
	 */
	_onPointerEnd( event: MouseEvent )
	{
		// To be safely release holded element, if screen becomes inactive while an element holded
		if ( this._holdedElement ){
			this._currentState = PointerStates.HOLDING;
		}

		switch( this._currentState )
		{
			case PointerStates.HOLDMOVING:
			case PointerStates.HOLDING: {
				this._releaseHold( event );
				break;
			}
		}

		super._onPointerEnd( event );
	}

	/** @internal */
	_onPointerMove( event: MouseEvent ): void
	{
		switch( this._currentState )
		{
			// Disable touch scroll if holding
			case PointerStates.HOLDMOVING: {
				event.stopImmediatePropagation();
				event.preventDefault();
				break;
			}

			// Disable touch scroll if holding
			case PointerStates.HOLDING: {
				event.stopImmediatePropagation();
				event.preventDefault();
				this._currentState = PointerStates.HOLDMOVING;
				break;
			}
		}

		super._onPointerMove( event );
	}

	/**
	 * @internal
	 */
	private _convertToHold( event: Event ): void
	{
		this._currentState = PointerStates.HOLDING;

		this._dispatchCustomEvent( "hold", { 
			target: event.target,
			position: { x: this._pointerStart.x, y: this._pointerStart.y }
		} );
		this._holdedElement = event.target as HTMLElement;
		this._holdedElement.dataset.holded = "1";

		// Removes the pointer selection if exist
		// (this._target as Window).getSelection()!.removeAllRanges();
	}

	/**
	 * @internal
	 */
	private _releaseHold( event: Event ): void
	{
		this._dispatchCustomEvent( "holdend", {
			target: this._holdedElement,
			endTarget: event.target,
			position: { x: this._pointerStart.x, y: this._pointerStart.y }
		} );
		this._holdedElement!.dataset.holded = "0";
		this._holdedElement = null;
	}
}