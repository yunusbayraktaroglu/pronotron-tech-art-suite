import { Vector2 } from "./Vector2";

import { PronotronAnimationController } from "@pronotron/utils";
import { PronotronClock } from "@pronotron/utils";

type PointerOptions = {
	tapThreshold: number;
	tappableClassname: string;
	holdThreshold: number;
	holdableClassname: string;
	/**
	 * Above the given delta value, interaction will be "MOVING", to avoid micro movements skip holding events
	 */
	movingDeltaLimit: number;
};

export enum PointerStates {
	IDLE,
	WAITING, // May change to: MOVING, HOLDING, TAP
	MOVING,
	HOLDING,
};

export abstract class PronotronPointerBase
{
	_currentState: PointerStates = PointerStates.IDLE;
	_isRunning: boolean = false;

	_pointerStartTime = 0;

	_tapThreshold = 0.3;
	_tapClassname = "tapable";
	_holdThreshold = 0.35;
	_holdableClassname = "holdable";
	_movingDeltaLimit = 1.0;

	_target: Window | Document | HTMLElement;
	_clock: PronotronClock;
	_animationController: PronotronAnimationController;

	_pointerStart = new Vector2();
	_pointerEnd = new Vector2();
	_pointerDelta = new Vector2();
	
	abstract _getPointerPosition( event: Event ): { x: number; y: number };
	
	constructor( target: Window | Document | HTMLElement, animationController: PronotronAnimationController, clock: PronotronClock, options?: PointerOptions )
	{
		this._target = target;
		this._animationController = animationController;
		this._clock = clock;

		if ( options ){
			this.setOptions( options );
		}

		this._onStart = this._onStart.bind( this );
		this._onMove = this._onMove.bind( this );
		this._onEnd = this._onEnd.bind( this );
	}

	getCurrentState(): string
	{
		return PointerStates[ this._currentState ];
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

	setOptions( options: PointerOptions ): void
	{
		this._tapThreshold = options.tapThreshold;
		this._tapClassname = options.tappableClassname;
		this._holdThreshold = options.holdThreshold;
		this._holdableClassname = options.holdableClassname;
		this._movingDeltaLimit = options.movingDeltaLimit;
	}

	_startEvents(): void 
	{
		this._isRunning = true;
	}

	_stopEvents(): void
	{
		this._isRunning = false;
	}

	_onStart( event: Event ): void
	{
		this._currentState = PointerStates.WAITING;
		this._pointerStartTime = this._clock.elapsedTime;

		if ( event.target && this._isTargetHoldable( event.target as HTMLElement ) ){
			this._animationController.addAnimation({
				id: "HOLD",
				duration: this._holdThreshold,
				timeStyle: "continious",
				forceFinish: "doNotRunOnEnd",
				onEnd: () => {
					this._convertToHold( event );
				}
			});
		}
	}

	_onMove( event: Event ): void
	{
		/**
		 * Disable touch scroll if holding
		 */
		if ( this._currentState === PointerStates.HOLDING ){
			event.preventDefault();
		}

		/**
		 * Check if movement is too big, user is moving pointer
		 */
		if ( this._currentState === PointerStates.WAITING && this._pointerDelta.lengthSq() > 1 ){
			this._currentState = PointerStates.MOVING;
		}
	}

	_onEnd( event: Event )
	{
		if ( this._clock.elapsedTime < this._pointerStartTime + this._tapThreshold ){
			this._target.dispatchEvent( new CustomEvent( "tap", {
				detail: {
					target: event.target,
					position: this._pointerStart
				}
			} ));
		}
	}

	/**
	 * Updates pointer "start", "end", and "delta" between start-end values
	 */
	_updatePointer( x: number, y: number ): void
	{
		this._pointerEnd.set( x, y );
		this._pointerDelta.subVectors( this._pointerEnd, this._pointerStart );
		this._pointerStart.copy( this._pointerEnd );
	}

	private _isTargetHoldable( target: HTMLElement ): boolean
	{
		return target.classList.contains( "holdable" );
	}
	
	private _convertToHold( event: Event ): void
	{
		if ( this._currentState === PointerStates.WAITING ){
			this._currentState = PointerStates.HOLDING;
			this._target.dispatchEvent( new CustomEvent( "hold", { 
				detail: {
					target: event.target,
					position: this._pointerStart
				} 
			} ));
		}
	}
}
