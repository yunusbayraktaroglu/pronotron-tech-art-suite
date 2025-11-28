import { PointerBase, PointerBaseDependencies, PointerState, type BaseSettings } from "./PointerBase";

/**
 * Details about a pointer hold event.
 */
export interface HoldEventDetail {
	position: {
		x: number;
		y: number;
	};
	holdTarget: HTMLElement;
};

/**
 * Details about a pointer hold release event.
 */
export interface ReleaseEventDetail {
	position: {
		x: number;
		y: number;
	};
	holdTarget: HTMLElement;
	releaseTarget: HTMLElement;
};

/**
 * Settings for a holdable pointer interaction.
 *
 * Extends BaseSettings with a threshold that determines how long a pointer
 * must be continuously pressed to be recognized as a "hold" gesture.
 *
 * @remarks
 * The holdThreshold is specified in seconds.
 *
 * @property holdThreshold - Duration in seconds required to trigger a hold gesture.
 * @default holdThreshold - 0.35
 */
export type HoldableSettings = BaseSettings & {
	/**
	 * Duration in seconds required to trigger a hold gesture.
	 * @default 0.35 sec
	 */
	holdThreshold: number;
};

export type PointerHoldableDependencies = PointerBaseDependencies & HoldableSettings & {
	/**
	 * User-provided function to determine whether a DOM element supports hold interaction.
	 * @param target HTMLElement that user trying to hold
	 */
	isHoldable: ( target: HTMLElement ) => boolean;
};

/**
 * Extends {@link PointerBase} to recognise long-press gestures.
 * Dispatches custom "hold" and "holdend" events on elements
 * that satisfy the user-supplied {@link _isHoldable} predicate.
 */
export class PointerHoldable extends PointerBase<"hold" | "holdend">
{
	/**
	 * User-provided function to determine whether a DOM element supports hold interaction.
	 * 
	 * @param target HTMLElement that user trying to hold
	 * @internal
	 */
	private _isHoldable: ( target: HTMLElement ) => boolean;

	/**
	 * Currently held element while in HOLDING/HOLD_DRAGGING; null when inactive.
	 * @internal
	 */
	private _holdedElement: HTMLElement | null = null;

	/**
	 * Duration in seconds required to trigger a hold gesture.
	 * @internal 
	 */
	_holdThreshold = 0.35;

	/**
	 * Defines if the current event target is holdable,
	 * @internal
	 */
	_canHold = false;

	constructor( dependencies: PointerHoldableDependencies )
	{
		super( dependencies );

		this._isHoldable = dependencies.isHoldable;
		this._updateSettings( dependencies );
	}
	
	/**
	 * Updates settings of the pointer controller
	 * @param settings 
	 * @internal
	 */
	_updateSettings( settings: HoldableSettings )
	{
		super._updateSettings( settings );
		this._holdThreshold = settings.holdThreshold;
	}

	/**
	 * Handles native pointer/touch start.
	 * If the event target passes the {@link _isHoldable} check, schedules a "HOLD" animation that will fire after
	 * {@link _holdThreshold} seconds unless cancelled. When the timer completes and the state is still PENDING,
	 * {@link _convertToHold} is invoked to enter the HOLDING state.
	 *
	 * Also calls the base implementation to maintain core behaviour.
	 * 
	 * @param event Current event object
	 * @internal
	 */
	_onPointerStart( event: Event ): void
	{
		/**
		 * @todo
		 * To avoid IOS mignifier appearing with long press, 
		 * .mayhold class might be added to document after 0.125 seconds to stop text selecting, magnifier appear.
		 * than waits for actual holdTreshold.
		 */
		if ( event.target && this._isHoldable( event.target as HTMLElement ) ){

			this._canHold = true;

			this._animator.add( {
				id: "HOLD",
				delay: this._holdThreshold,
				duration: 0,
				autoPause: false,
				onBegin: () => {
					// Covert to hold if still PENDING
					if ( this._currentState === PointerState.PENDING ){
						this._convertToHold( event );
					}
				}
			} );
			
		}
		
		super._onPointerStart( event );
	}

	/**
	 * Handles pointer movement during a potential hold.
	 * • If already in HOLDING, upgrades the state to HOLD_DRAGGING.
	 * • Stops propagation and prevents default to disable native scrolling or text selection while holding.
	 *
	 * Always forwards to the base `_onPointerMove` for normal movement handling.
	 *
	 * @param event Current event object
	 * @internal
	 */
	_onPointerMove( event: Event ): void
	{
		if ( this._currentState === PointerState.HOLD_DRAGGING || this._currentState === PointerState.HOLDING ){
			
			/**
			 * Disable touch scroll on HOLD_DRAGGING
			 * 
			 * @challenges
			 * Only works if touchstart event listener is prevented.
			 * It doesn't aborts touch scroll on Android Chrome, need further investigation.
			 * 
			 * As a workaround, 'overflow: hidden' can be applied to body on hold start.
			 * Its recommended by MDN.
			 * 
			 * @see https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault
			 */
			event.preventDefault();
			//event.stopPropagation();
			//event.stopImmediatePropagation();

			this._currentState = PointerState.HOLD_DRAGGING;
		}

		this._canHold = false;
		super._onPointerMove( event );
	}

	/**
	 * Handles pointer/touch release.
	 * - If a hold is active (HOLDING or HOLD_DRAGGING), invokes {@link _releaseHold} to emit the "holdend" event and clear internal state.
	 * - Guarantees safe cleanup even if the browser fires an extra move event before end.
	 *
	 * Calls the base `_onPointerEnd` for standard tap detection.
	 *
	 * @param event Current event object
	 * @internal
	 */
	_onPointerEnd( event: Event ): void
	{
		this._canHold = false;

		/**
		 * To be safely release holded element, 
		 * Eg: if the screen becomes inactive while an element is holded
		 */
		if ( this._holdedElement ){
			this._currentState = PointerState.HOLDING;
		}

		switch( this._currentState )
		{
			case PointerState.HOLD_DRAGGING:
			case PointerState.HOLDING: {
				this._releaseHold( event );
				break;
			};
		}

		super._onPointerEnd( event );
	}

	/**
	 * Converts state to {@link PointerState.HOLDING} 
	 * if the necessary conditions are met, and triggers custom "hold" event with details
	 * 
	 * @internal
	 */
	private _convertToHold( event: Event ): void
	{
		this._currentState = PointerState.HOLDING;

		const holdEvent: HoldEventDetail = {
			position: { 
				x: this._pointerStart.x,
				y: this._pointerStart.y
			},
			holdTarget: event.target as HTMLElement
		};
		
		this._dispatchCustomEvent( "hold", holdEvent )

		this._holdedElement = event.target as HTMLElement;
	}

	/**
	 * Releases the {@link _holdedElement} and triggers "holdend" event with details
	 * 
	 * @internal
	 */
	private _releaseHold( event: Event ): void
	{
		const releaseEventDetail: ReleaseEventDetail = {
			position: { 
				x: this._pointerStart.x,
				y: this._pointerStart.y
			},
			holdTarget: this._holdedElement!,
			releaseTarget: event.target as HTMLElement,
		};

		this._dispatchCustomEvent( "holdend", releaseEventDetail );

		this._holdedElement = null;
	}
}