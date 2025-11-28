import { PronotronClock, PronotronAnimator, Vector2 } from "@pronotron/utils";
import { EventUtils } from "../helpers/EventUtils";

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
 * Details of a tap event.
 */
export interface TapEventDetail {
	/**
	 * The HTML element that was tapped.
	 */
	tapTarget: HTMLElement;
	/**
	 * The coordinates where the tap occurred.
	 */
	position: {
		x: number;
		y: number;
	};
};

/**
 * Elements or globals that can receive pointer events.
 */
export type PossibleTarget = Window | Document | HTMLElement;
/**
 * Configuration options for pointer interaction behavior.
 */
export type BaseSettings = {
	/**
	 * Seconds of inactivity before auto-transition to IDLE.
	 * @default 0.5 sec.
	 */
	idleThreshold: number;
	/**
	 * Maximum duration (in seconds) for a tap event.
	 * @default 0.25 sec.
	 */
	tapThreshold: number;
	/**
	 * Minimum squared-pixel distance required to treat
	 * movement as a true drag rather than micro-jitter.
	 * @default 10 px
	 */
	movingDeltaLimit: number;
	/**
	 * Optional initial position of the pointer, specified as `{ x, y }`. 
	 * If omitted, defaults to the top-left corner.
	 */
	startPosition?: {
		x: number;
		y: number;
	};
};
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
 * Base class for pointer input (mouse|touch) that normalizes
 * state transitions (idle, waiting, moving, holding) and
 * emits high-level events like "tap".
 */
export class PointerBase<TDispatchableEvents extends string = string> extends EventUtils<TDispatchableEvents | "tap">
{
	/**
	 * Current element under the pointer
	 * 
	 * - `Touch`: This is the element that received the initial *touchstart* event
	 * - `Mouse`: This is the element currently under the cursor
	 */
	public pointerTarget: HTMLElement | null = null;

	/**
	 * Defines if the current event target is interactable,
	 * Updated pointer start and pointer move
	 * @internal
	 */
	_canInteract: boolean = false;

	/**
	 * Defines current pointer state
	 * @internal
	 */
	_currentState: PointerState = PointerState.IDLE;

	/**
	 * Pointer events target
	 * @internal
	 */
	readonly _target: PossibleTarget;
	/**
	 * Clock instance used to drive and timestamp pointer interactions.
	 * @internal
	 */
	readonly _clock: PronotronClock;
	/**
	 * The animator instance used to manage animations for pointer interactions.
	 * @internal
	 */
	readonly _animator: PronotronAnimator;

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
	 * Accumulates the total, unconsumed delta (delta x and y) registered 
	 * from pointer events. This serves as the target position for the
	 * easing/inertia/glide mechanism.
	 * @internal
	 */
	readonly _pointerDeltaAdditive = new Vector2();

	/**
	 * Timeout for the IDLE transition
	 * @internal
	 */
	_idleThreshold = 0.5;
	/**
	 * Timeout for the TAP event
	 * @internal
	 */
	_tapThreshold = 0.25;
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
	 * Should return true if the element under the pointer
	 * should be considered “interactive” (e.g. buttons, links).
	 * Method provided by user.
	 * 
	 * @param target Current event target
	 * @internal
	 */
	private _isInteractable: ( target: HTMLElement ) => boolean;

	constructor( dependencies: PointerBaseDependencies )
	{
		super();

		this._target = dependencies.target;
		this._animator = dependencies.animator;
		this._clock = dependencies.clock;

		this._isInteractable = dependencies.isInteractable;

		// User may want change start position of the pointer, instead of top-left corner
		if ( dependencies.startPosition ){

			const { x, y } = dependencies.startPosition;

			this._pointerStart.set( x, y );
			this._pointerEnd.set( x, y );
			
		}

		this._updateSettings( dependencies );
	}

	/**
	 * Updates settings of the pointer controller
	 * @param settings
	 * 
	 * @internal
	 */
	_updateSettings( baseSettings: BaseSettings ): void
	{
		this._idleThreshold = baseSettings.idleThreshold;
		this._tapThreshold = baseSettings.tapThreshold;
		this._movingDeltaLimit = baseSettings.movingDeltaLimit;
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

		this._pointerStartTime = this._clock.getTime().elapsedTime;

		// Reset pointer delta to calculate movement limit correct in _onMove
		this._pointerDelta.set( 0, 0 );
		
		// Is pointer current target is interactable
		this._canInteract = this._isInteractable( event.target as HTMLElement );
		
		this.pointerTarget = event.target as HTMLElement;
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
				if ( this._pointerDelta.lengthSq() > this._movingDeltaLimit ){
					this._currentState = PointerState.MOVING;
				}
			};
		}

		/**
		 * @fix
		 * On touch input, pointermove event target is always the element that received pointerdown(touchstart).
		 * So it is only valid with mouse input.
		 */
		// Moving or Waiting, control if the target is interactable(button, a, custom class)
		this._canInteract = this._isInteractable( event.target as HTMLElement );
		this.pointerTarget = event.target as HTMLElement;

		// Refresh idle timer so the state only flips to IDLE after the user truly stops moving.
		this._animator.add( {
			id: "IDLE",
			delay: this._idleThreshold,
			duration: 0,
			autoPause: false,
			onBegin: () => {
				if ( this._currentState === PointerState.MOVING ){
					this._currentState = PointerState.IDLE;
				}
			}
		} );
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
		const currentTime = this._clock.getTime().elapsedTime;
		
		if ( this._currentState === PointerState.PENDING && currentTime < this._pointerStartTime + this._tapThreshold ){

			const tapEventDetail: TapEventDetail = {
				tapTarget: event.target as HTMLElement,
				position: { 
					x: this._pointerStart.x, 
					y: this._pointerStart.y 
				}
			};

			this._dispatchCustomEvent( "tap", tapEventDetail );
		}

		this._currentState = PointerState.IDLE;
		this.pointerTarget = event.target as HTMLElement;
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
		this._pointerEnd.set( x, y );
		this._pointerDelta.sub( this._pointerEnd, this._pointerStart );
		this._pointerDeltaAdditive.add( this._pointerDelta );
		this._pointerStart.copy( this._pointerEnd );
	}

}