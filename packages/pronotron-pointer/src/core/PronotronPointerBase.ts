import { Vector2 } from "./Vector2";

import { PronotronAnimationController } from "@pronotron/utils";
import { PronotronClock } from "@pronotron/utils";

type PointerOptions = {
	interactables: {
		links: boolean;
		buttons: boolean;
		customClasses: boolean;
	};
	idleTreshold: number;
	interactiveClassname: string;
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
	TAP,
	WAITING, // May change to: MOVING, HOLDING, HOLDMOVING
	DRAG, // Native drag event
	MOVING,
	HOLDING,
	HOLDMOVING,
};

export abstract class PronotronPointerBase
{
	_holdedElement: HTMLElement | null = null;

	_currentState: PointerStates = PointerStates.IDLE;
	_isInteractable = false;
	
	_isRunning: boolean = false;

	_pointerStartTime = 0;

	_idleTreshold = 0.5;
	_tapThreshold = 0.3;
	_tapClassname = "tapable";
	_holdThreshold = 0.35;
	_holdableClassname = "holdable";
	_movingDeltaLimit = 10.0;

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

		this._onDragStart = this._onDragStart.bind( this );
		this._onDragEnd = this._onDragEnd.bind( this );
	}

	getCurrentState(): string
	{
		return PointerStates[ this._currentState ];
	}

	getTargetInteractable(): boolean
	{
		return this._isInteractable;
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
		this._idleTreshold = options.idleTreshold;
		this._tapThreshold = options.tapThreshold;
		this._holdThreshold = options.holdThreshold;
		this._movingDeltaLimit = options.movingDeltaLimit;
		this._tapClassname = options.tappableClassname;
		this._holdableClassname = options.holdableClassname;
	}

	_startEvents(): void 
	{
		this._isRunning = true;
	}

	_stopEvents(): void
	{
		this._isRunning = false;
		this._currentState = PointerStates.IDLE;
	}




	_onDragStart( event: Event ): void
	{
		/**
		 * While holding select-none class is added that disables drag operation
		 * @remove
		 */
		console.log( "drag start" );
		if ( this._currentState === PointerStates.HOLDING || this._currentState === PointerStates.HOLDMOVING ){
			event.stopPropagation();
			event.preventDefault();
			return;
		}
		this._currentState = PointerStates.DRAG;
	}

	_onDragEnd( event: Event ): void
	{
		console.log( "drag end" );
		event.preventDefault();
		this._currentState = PointerStates.IDLE;
	}

	/**
	 * Interaction started
	 * 
	 * Mouse: pointerdown
	 * Touch: touchstart
	 */
	_onStart( event: Event ): void
	{
		this._currentState = PointerStates.WAITING;
		this._pointerStartTime = this._clock.elapsedTime;

		this._pointerDelta.set( 0, 0 );
		
		this._lookTarget( event );

		if ( event.target && this._isTargetHoldable( event.target as HTMLElement ) ){
			this._animationController.addAnimation({
				id: "HOLD",
				duration: this._holdThreshold,
				timeStyle: "continious",
				onEnd: ( forced ) => {
					if ( ! forced ){
						this._convertToHold( event );
					}
				}
			});
		}
	}

	_onMove( event: Event ): void
	{
		//event.stopImmediatePropagation();

		switch( this._currentState ){

			case PointerStates.DRAG: {
				//event.stopImmediatePropagation();
				event.preventDefault();
				return;
			}

			case PointerStates.HOLDMOVING: {
				/**
				 * Disable touch scroll if holding
				 */
				//event.stopImmediatePropagation();
				event.preventDefault();
				return;
			}

			case PointerStates.HOLDING: {
				/**
				 * Disable touch scroll if holding
				 */
				event.stopImmediatePropagation();
				event.preventDefault();
				this._currentState = PointerStates.HOLDMOVING;
				return;
			}

			case PointerStates.IDLE:
			case PointerStates.WAITING: {
				/**
				 * Convert WAITING to MOVING if pointer delta is bigger than defined limit
				 */
				if ( this._pointerDelta.lengthSq() > this._movingDeltaLimit ){
					this._currentState = PointerStates.MOVING;
				}
			}

		}

		this._lookTarget( event );

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
	 * In mouse, will fire onMove 1 time after onEnd.
	 * 
	 * Solution: onEnd can only fire, if interaction started (onStart).
	 * Add a prop to 1 onEnd, in onMove 1, disable it and continue
	 */
	_onEnd( event: Event )
	{
		console.log( "end runs" );

		// Dragstart event releases pointerdown
		if ( this._currentState === PointerStates.DRAG ){
			return;
		}

		if ( this._holdedElement || this._currentState === PointerStates.HOLDING || this._currentState === PointerStates.HOLDMOVING ){
			this._target.dispatchEvent( new CustomEvent( "holdend", {
				detail: {
					target: this._holdedElement,
					endTarget: event.target,
					position: this._pointerStart
				}
			} ));
			this._holdedElement!.dataset.holded = "0";
			this._holdedElement = null;
		}

		else if ( this._currentState === PointerStates.WAITING && this._clock.elapsedTime < this._pointerStartTime + this._tapThreshold ){
			this._target.dispatchEvent( new CustomEvent( "tap", {
				detail: {
					target: event.target,
					position: this._pointerStart
				}
			} ));
		}

		this._currentState = PointerStates.IDLE;
	}





	
	private _lookTarget( event: Event )
	{
		if ( this._isTargetInteractable( event.target as HTMLElement ) ){
			this._isInteractable = true;
		} else {
			this._isInteractable = false;
		}
	}

	/**
	 * Updates pointer "start", "end", and "delta" between start-end values
	 * @internal
	 */
	protected _updatePointer( x: number, y: number ): void
	{
		this._pointerEnd.set( x, y );
		this._pointerDelta.subVectors( this._pointerEnd, this._pointerStart );
		this._pointerStart.copy( this._pointerEnd );
	}

	private _isTargetInteractable( target: HTMLElement ): boolean
	{
		return target.classList.contains( "holdable" ) || target.tagName === "A";
	}

	private _isTargetHoldable( target: HTMLElement ): boolean
	{
		return target.dataset.holded ? true : false;
		return target.classList.contains( "holdable" );
	}
	
	private _convertToHold( event: Event ): void
	{
		if ( this._currentState === PointerStates.WAITING ){
			this._currentState = PointerStates.HOLDING;
			this._holdedElement = event.target as HTMLElement;
			//(this._target as Window).getSelection()!.removeAllRanges();
			( event.target as HTMLElement ).dataset.holded = "1";
			this._target.dispatchEvent( new CustomEvent( "hold", { 
				detail: {
					target: event.target,
					position: this._pointerStart
				} 
			} ));
		}
	}
}
