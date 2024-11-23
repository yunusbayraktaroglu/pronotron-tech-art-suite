import { PronotronClock, PronotronAnimationController } from "@pronotron/utils";
import { EventUtils } from "./EventUtils";
import { Vector2 } from "./Vector2";

export enum PointerStates {
	IDLE,
	WAITING, // May change to: DRAG, MOVING, HOLDING, HOLDMOVING
	DRAG, // Native drag event
	MOVING,
	HOLDING,
	HOLDMOVING,
	OUT,
};

export type PossibleTarget = Window | Document | HTMLElement;

export type CommonDependencies = {
	target: PossibleTarget;
	animationController: PronotronAnimationController;
	clock: PronotronClock;
	idleTreshold: number;
	movingDeltaLimit: number;
	isInteractable: ( target: HTMLElement ) => boolean;
};

export class PointerBase<T extends string> extends EventUtils<T>
{
	/** @internal */
	_isRunning: boolean = false;

	/** @internal */
	_target: PossibleTarget;
	/** @internal */
	_clock: PronotronClock;
	/** @internal */
	_animationController: PronotronAnimationController;

	/** @internal */
	_currentState = PointerStates.IDLE;

	/** @internal */
	_pointerStart = new Vector2();
	/** @internal */
	_pointerEnd = new Vector2();
	/** @internal */
	_pointerDelta = new Vector2();

	/** @internal */
	_idleTreshold = 0.5;
	/** @internal */
	_movingDeltaLimit = 10.0;
	/** @internal */
	_canInteract = false;
	/** @internal */
	_isInteractable: ( target: HTMLElement ) => boolean;

	constructor({ target, animationController, clock, isInteractable, idleTreshold, movingDeltaLimit }: CommonDependencies)
	{
		super();

		this._target = target;
		this._animationController = animationController;
		this._clock = clock;

		this._isInteractable = isInteractable;
		this._idleTreshold = idleTreshold;
		this._movingDeltaLimit = movingDeltaLimit;
		
		this._onPointerStart = this._onPointerStart.bind( this );
		this._onPointerMove = this._onPointerMove.bind( this );
		this._onPointerEnd = this._onPointerEnd.bind( this );
	}

	getCurrentState(): string
	{
		return PointerStates[ this._currentState ];
	}

	getTargetInteractable(): boolean
	{
		return this._canInteract;
	}

	getPosition(): { x: number; y: number; }
	{
		/**
		 * PointerEnd is always equal to PointerStart. But PointerStart might be different than PointerEnd.
		 * Return PointerStart.
		 */
		return this._pointerStart;
	}

	getMovement(): { x: number; y: number; }
	{
		return this._pointerDelta;
	}

	/** @internal */
	_startEvents(): void 
	{
		if ( this._isRunning ){
			return console.warn( "Already running" );
		}

		this._isRunning = true;
		this._currentState = PointerStates.IDLE;
	}

	/** @internal */
	_stopEvents(): void
	{
		this._isRunning = false;
		this._currentState = PointerStates.IDLE;
	}

	/**
	 * Interaction started
	 * 
	 * Mouse: pointerdown
	 * Touch: touchstart
	 * 
	 * @internal
	 */
	_onPointerStart( event: Event ): void
	{
		this._currentState = PointerStates.WAITING;

		// Reset pointer delta to calculate movement limit correct in _onMove
		this._pointerDelta._set( 0, 0 );
		
		// Is pointer current target is interactable
		this._canInteract = this._isInteractable( event.target as HTMLElement );
	}

	/**
	 * Runs after invidual child class updates the pointer position
	 * 
	 * @internal
	 */
	_onPointerMove( event: Event ): void
	{
		switch( this._currentState )
		{
			// Break switch early if just moving
			case PointerStates.MOVING: {
				break;
			}

			// Convert WAITING or IDLE to MOVING if pointer delta is bigger than defined limit
			case PointerStates.IDLE:
			case PointerStates.WAITING: {
				if ( this._pointerDelta._lengthSq() > this._movingDeltaLimit ){
					this._currentState = PointerStates.MOVING;
				}
			}
		}

		// Moving or Waiting, control if the target is interactable(button, a, custom class)
		this._canInteract = this._isInteractable( event.target as HTMLElement );

		// Works like refreshed timeout, but its safe
		this._animationController.addAnimation({
			id: "IDLE",
			duration: this._idleTreshold,
			timeStyle: "continious",
			onEnd: ( forced ) => {
				if ( ! forced && this._currentState === PointerStates.MOVING ){
					this._currentState = PointerStates.IDLE;
				}
			}
		});
	}
	
	/**
	 * @internal
	 */
	_onPointerEnd( _event: Event )
	{
		this._currentState = PointerStates.IDLE;
	}

	/**
	 * Used by child classes, after getting pointer x and y by their invidual methods, 
	 * Updates pointer data values
	 * @internal
	 */
	_updatePointer( x: number, y: number ): void
	{
		this._pointerEnd._set( x, y );
		this._pointerDelta._subVectors( this._pointerEnd, this._pointerStart );
		this._pointerStart._copy( this._pointerEnd );
	}

}