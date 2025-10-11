import { PronotronClock, PronotronAnimator } from "@pronotron/utils";
import { EventUtils } from "./helpers/EventUtils";
import { Vector2 } from "./helpers/Vector2";

/**
 * High-level pointer state machine.
 */
export enum PointerState
{
	/**
	 * No active pointer contact/action
	 */
	IDLE,
	/**
	 * Pointer is down and awaiting gesture detection
	 */         
	PENDING,
	/**
	 * Native hold&drag operation in progress
	 */
	DRAGGING,
	/**
	 * User is moving pointer (not a drag payload)
	 */
	MOVING,
	/**
	 * Long-press with little/no movement on a holdable element
	 */
	HOLDING,
	/**
	 * Long-press + movement (holding while moving)
	 */
	HOLD_DRAGGING,
	/**
	 * Pointer left the target element or viewport
	 */
	OUTSIDE,
};

/**
 * Elements or globals that can receive pointer events.
 */
export type PossibleTarget = Window | Document | HTMLElement;
export type BaseSettings = {
	/**
	 * Seconds of inactivity before auto-transition to IDLE.
	 * @default 0.5 sec.
	 */
	idleThreshold: number;
	/**
	 * Seconds of tap event.
	 * @default 0.25 sec.
	 */
	tapThreshold: number;
	/**
	 * Minimum squared-pixel distance required to treat
	 * movement as a true drag rather than micro-jitter.
	 * @default 10
	 */
	movingDeltaLimit: number;
}
export type PointerBaseDependencies = BaseSettings & {
	/**
	 * DOM node or global object that pointer listeners attach to.
	 */
	target: PossibleTarget;
	/**
	 * Central animation scheduler for idle timers.
	 */
	animator: PronotronAnimator;
	/**
	 * Shared clock used to measure elapsed time for taps/holds.
	 */
	clock: PronotronClock;
	/**
	 * Should return true if the element under the pointer
	 * should be considered “interactive” (e.g. buttons, links).
	 * Method provided by user.
	 * 
	 * @param target Current event target
	 */
	isInteractable: ( target: HTMLElement ) => boolean;
};

/**
 * Base class for pointer input (mouse/touch) that normalizes
 * state transitions (idle, waiting, moving, holding) and
 * emits high-level events like "tap".
 */
export class PointerBase<TDispatchableEvents extends string = string> extends EventUtils<TDispatchableEvents | "tap">
{
	/**
	 * True while event listeners are active
	 * @internal
	 */
	_isRunning: boolean = false;

	/** @internal */
	_clock: PronotronClock;

	/** @internal */
	_animator: PronotronAnimator;

	/**
	 * Pointer events target
	 * @internal
	 */
	_target: PossibleTarget;
	
	/**
	 * Defines current pointer state
	 * @internal
	 */
	_currentState: PointerState = PointerState.IDLE;

	/**
	 * Start position of the pointer
	 * @internal
	 */
	readonly _pointerStart = new Vector2();
	/**
	 * End position of the pointer
	 * @internal
	 */
	readonly _pointerEnd = new Vector2();
	/**
	 * Pointer delta calculated with pointer _pointerEnd - pointerStart
	 * @internal
	 */
	readonly _pointerDelta = new Vector2();

	/**
	 * Timeout for the IDLE transition
	 * @internal
	 */
	private _idleThreshold = 0.5;
	/**
	 * Timeout for the TAP event
	 * @internal
	 */
	private _tapThreshold = 0.25;
	/**
	 * Pixel limit to convert IDLE to MOVING, helps to keep state on micro movements
	 * @internal
	 */
	_movingDeltaLimit = 10.0;

	/**
	 * Start time of the pointer, to calculate a TAP
	 * @internal
	 */
	private _pointerStartTime = 0;

	/**
	 * Defines if the current event target is interactable,
	 * Updated pointer start and pointer move
	 * @internal
	 */
	_canInteract = false;

	/**
	 * Should return true if the element under the pointer
	 * should be considered “interactive” (e.g. buttons, links).
	 * Method provided by user.
	 * 
	 * @param target Current event target
	 * @internal
	 */
	private _isInteractable: ( target: HTMLElement ) => boolean;

	constructor({ target, animator, clock, idleThreshold, tapThreshold, movingDeltaLimit, isInteractable }: PointerBaseDependencies)
	{
		super();

		this._target = target;
		this._animator = animator;
		this._clock = clock;

		this._idleThreshold = idleThreshold;
		this._tapThreshold = tapThreshold;
		this._movingDeltaLimit = movingDeltaLimit;
		this._isInteractable = isInteractable;
	}

	/**
	 * Initializes pointer tracking and sets the state to `IDLE`.
	 * Call once when attaching listeners.
	 * Warns and returns early if already running.
	 * 
	 * @internal
	 */
	_startEvents(): boolean
	{
		if ( this._isRunning ){
			console.warn( "Already running" );
			return false;
		}

		this._isRunning = true;
		this._currentState = PointerState.IDLE;
		return true;
	}

	/**
	 * Stops pointer tracking and forces the state back to `IDLE`.
	 * Call when removing listeners or disposing the instance.
	 * 
	 * @internal
	 */
	_stopEvents(): void
	{
		this._isRunning = false;
		this._currentState = PointerState.IDLE;
	}

	/**
	 * Handles native `pointerdown`/`touchstart`.
	 * Resets movement delta, records the press timestamp,
	 * and sets the state to `WAITING` while gesture detection begins.
	 * 
	 * @param event Current Event 
	 * @internal
	 */
	_onPointerStart( event: Event ): void
	{
		// Pending for transition
		this._currentState = PointerState.PENDING;

		const { elapsedTime } = this._clock.getTime();

		this._pointerStartTime = elapsedTime;

		// Reset pointer delta to calculate movement limit correct in _onMove
		this._pointerDelta._set( 0, 0 );
		
		// Is pointer current target is interactable
		this._canInteract = this._isInteractable( event.target as HTMLElement );
	}

	/**
	 * Handles native `pointermove`/`touchmove`.
	 * - Promotes state from `IDLE` or `WAITING` to `MOVING` once movement exceeds `movingDeltaLimit`.
	 * - Refreshes the idle timer so the state only reverts to `IDLE` after the pointer truly stops moving.
	 * 
	 * @param event Current Event 
	 * @internal
	 */
	_onPointerMove( event: Event ): void
	{
		switch( this._currentState )
		{
			// Convert WAITING or IDLE to MOVING if pointer delta is bigger than defined limit
			case PointerState.IDLE:
			case PointerState.PENDING: {
				if ( this._pointerDelta._lengthSq() > this._movingDeltaLimit ){
					this._currentState = PointerState.MOVING;
				}
			};
		}

		// Moving or Waiting, control if the target is interactable(button, a, custom class)
		this._canInteract = this._isInteractable( event.target as HTMLElement );

		// Refresh idle timer so the state only flips to IDLE after the user truly stops moving.
		this._animator.add({
			id: "IDLE",
			duration: this._idleThreshold,
			autoPause: false,
			onEnd: ( forced ) => {
				if ( ! forced && this._currentState === PointerState.MOVING ){
					this._currentState = PointerState.IDLE;
				}
			}
		});
	}
	
	/**
	 * Handles native `pointerup`/`touchend`.
	 * Dispatches a "tap" event if the duration from press to release
	 * is less than `_tapThreshold`, then resets state to `IDLE`.
	 * 
	 * @param event Current Event 
	 * @internal
	 */
	_onPointerEnd( event: Event )
	{
		const { elapsedTime } = this._clock.getTime();
		
		if ( elapsedTime < this._pointerStartTime + this._tapThreshold ){
			this._dispatchCustomEvent( "tap", {
				target: event.target,
				position: { 
					x: this._pointerStart.x, 
					y: this._pointerStart.y 
				}
			} );
		}
		this._currentState = PointerState.IDLE;
	}

	/**
	 * Updates pointer vectors: sets _pointerEnd to (x,y),
	 * computes delta from previous _pointerStart,
	 * then copies end → start for next frame.
	 * 
	 * @param x X position
	 * @param y Y position
	 * @internal
	 */
	_updatePointer( x: number, y: number ): void
	{
		this._pointerEnd._set( x, y );
		this._pointerDelta._subVectors( this._pointerEnd, this._pointerStart );
		this._pointerStart._copy( this._pointerEnd );
	}

}