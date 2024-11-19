import { Vector2 } from "./Vector2";
import { PronotronClock, PronotronAnimationController } from "@pronotron/utils";

type CustomEvents = "tap" | "hold" | "holdend";

type PointerOptions = {
	tresholds?: {
		idleTreshold: number;
		tapThreshold: number;
		holdThreshold: number;
		/**
		 * Above the given delta value, interaction will be "MOVING", to avoid micro movements skip holding events
		 */
		movingDeltaLimit: number;
	}

	targetHoldable: ( target: HTMLElement ) => boolean;
	targetInteractable: ( target: HTMLElement ) => boolean;
};

export enum PointerStates {
	IDLE,
	WAITING, // May change to: DRAG, MOVING, HOLDING, HOLDMOVING
	DRAG, // Native drag event
	MOVING,
	HOLDING,
	HOLDMOVING,
};

export abstract class PronotronPointerBase
{
	abstract startEvents(): void;
	abstract stopEvents(): void;
	abstract _getPointerPosition( event: Event ): { x: number; y: number };

	_isRunning: boolean = false;

	_target: Window | Document | HTMLElement;
	_clock: PronotronClock;
	_animationController: PronotronAnimationController;

	private _currentState: PointerStates = PointerStates.IDLE;
	private _holdedElement: HTMLElement | null = null;
	private _isInteractable = false;

	private _pointerStartTime = 0;

	private _idleTreshold = 0.5;
	private _tapThreshold = 0.3;
	private _holdThreshold = 0.35;
	private _movingDeltaLimit = 10.0;

	_pointerStart = new Vector2();
	_pointerEnd = new Vector2();
	_pointerDelta = new Vector2();
	
	/**
	 * Let user define how to detect interactable and holdable elements
	 */
	private _isInteractableFunction: ( target: HTMLElement ) => boolean;
	private _isHoldableFunction: ( target: HTMLElement ) => boolean;

	constructor( target: Window | Document | HTMLElement, animationController: PronotronAnimationController, clock: PronotronClock, options: PointerOptions )
	{
		this._target = target;
		this._animationController = animationController;
		this._clock = clock;

		this._isInteractableFunction = options.targetInteractable;
		this._isHoldableFunction = options.targetHoldable;

		if ( options.tresholds ){
			this.setOptions( options.tresholds );
		}

		this._onPointerStart = this._onPointerStart.bind( this );
		this._onPointerMove = this._onPointerMove.bind( this );
		this._onPointerEnd = this._onPointerEnd.bind( this );

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

	setOptions( tresholds: PointerOptions[ "tresholds" ] ): void
	{
		this._idleTreshold = tresholds!.idleTreshold;
		this._tapThreshold = tresholds!.tapThreshold;
		this._holdThreshold = tresholds!.holdThreshold;
		this._movingDeltaLimit = tresholds!.movingDeltaLimit;
	}


	/**
	 * Add event listeners as list to target
	 * @param events List of events to add target
	 * @internal
	 */
	protected _addEventListeners<E extends Event>( ...events: [ keyof GlobalEventHandlersEventMap, ( event: E ) => void ][] ): void 
	{
		events.forEach(([ eventKey, listener ]) => {
			this._target.addEventListener( eventKey, listener as EventListener );
		});
	}

	/**
	 * Remove events from target
	 * @param events List of events to remove from target
	 * @internal
	 */
	protected _removeEventListeners<E extends Event>( ...events: [ keyof GlobalEventHandlersEventMap, ( event: E ) => void ][] ): void 
	{
		events.forEach(([ eventKey, listener ]) => {
			this._target.removeEventListener( eventKey, listener as EventListener );
		});
	}

	/**
	 * Dispatches a possible custom event with detail object
	 * @param customEvent One of possible custom events
	 * @param detail Custom event detail
	 * @internal
	 */
	protected _dispatchCustomEvent( customEvent: CustomEvents, detail: { [ key: string ]: any } ): void
	{
		this._target.dispatchEvent( new CustomEvent( customEvent, { detail } ) );
	}

	/**
	 * Used by child classes, after getting pointer x and y by their invidual methods, 
	 * Updates pointer data values
	 * @internal
	 */
	protected _updatePointer( x: number, y: number ): void
	{
		this._pointerEnd.set( x, y );
		this._pointerDelta.subVectors( this._pointerEnd, this._pointerStart );
		this._pointerStart.copy( this._pointerEnd );
	}




	_startEvents(): void 
	{
		if ( this._isRunning ){
			return console.warn( "Already running" );
		}

		this._isRunning = true;
		this._currentState = PointerStates.IDLE;
	}

	_stopEvents(): void
	{
		this._isRunning = false;
		this._currentState = PointerStates.IDLE;
	}



	/**
	 * While holding select-none class is added that disables drag operation
	 * Previous may only be: WAITING or MOVING
	 * @internal
	 */
	protected _onDragStart( event: Event ): void
	{
		this._currentState = PointerStates.DRAG;
	}

	/**
	 * @internal
	 */
	protected _onDragEnd( event: Event ): void
	{
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
	protected _onPointerStart( event: Event ): void
	{
		this._currentState = PointerStates.WAITING;
		this._pointerStartTime = this._clock.elapsedTime;

		// Reset pointer delta to calculate movement limit correct in _onMove
		this._pointerDelta.set( 0, 0 );
		
		// Is pointer current target is interactable
		this._isInteractable = this._isInteractableFunction( event.target as HTMLElement );

		if ( event.target && this._isHoldableFunction( event.target as HTMLElement ) ){
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
	}

	/**
	 * Runs after invidual child class updates the pointer position
	 * 
	 * @internal
	 */
	protected _onPointerMove( event: Event ): void
	{
		switch( this._currentState ){

			// Break switch early if just moving
			case PointerStates.MOVING: {
				break;
			}

			// Native dragover(dragging) is connected to _onMove, we only updating the pointer position
			case PointerStates.DRAG: {
				return;
			}

			// Disable touch scroll if holding
			case PointerStates.HOLDMOVING: {
				event.stopImmediatePropagation();
				event.preventDefault();
				return;
			}

			// Disable touch scroll if holding
			case PointerStates.HOLDING: {
				event.stopImmediatePropagation();
				event.preventDefault();
				this._currentState = PointerStates.HOLDMOVING;
				return;
			}

			// Convert WAITING or IDLE to MOVING if pointer delta is bigger than defined limit
			case PointerStates.IDLE:
			case PointerStates.WAITING: {
				if ( this._pointerDelta.lengthSq() > this._movingDeltaLimit ){
					this._currentState = PointerStates.MOVING;
				}
			}

		}

		// Moving or Waiting, control if the target is interactable(button, a, custom class)
		this._isInteractable = this._isInteractableFunction( event.target as HTMLElement );

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
	 * In mouse, will fire onMove 1 time after onEnd.
	 * 
	 * Solution: onEnd can only fire, if interaction started (onStart).
	 * Add a prop to 1 onEnd, in onMove 1, disable it and continue
	 * 
	 * @internal
	 */
	protected _onPointerEnd( event: Event )
	{
		// To be safely release holded element, if screen becomes inactive while an element holded
		if ( this._holdedElement ){
			this._currentState = PointerStates.HOLDING;
		}

		switch( this._currentState ){

			// Dragstart event releases pointerdown, return early without changing state
			case PointerStates.DRAG: {
				return;
			};

			case PointerStates.HOLDMOVING:
			case PointerStates.HOLDING: {
				this._releaseHold( event );
				break;
			}

			case PointerStates.WAITING: {
				this._controlTap( event );
				break;
			}

		}

		this._currentState = PointerStates.IDLE;
	}







	/**
	 * @internal
	 */
	private _controlTap( event: Event ): void
	{
		if ( this._clock.elapsedTime < this._pointerStartTime + this._tapThreshold ){
			this._dispatchCustomEvent( "tap", {
				target: event.target,
				position: { x: this._pointerStart.x, y: this._pointerStart.y }
			} );
		}
	}

	/**
	 * @internal
	 */
	private _convertToHold( event: Event ): void
	{
		this._currentState = PointerStates.HOLDING;
		this._holdedElement = event.target as HTMLElement;

		// Removes the pointer selection if exist
		// (this._target as Window).getSelection()!.removeAllRanges();

		( event.target as HTMLElement ).dataset.holded = "1";

		this._dispatchCustomEvent( "hold", { 
			target: event.target,
			position: { x: this._pointerStart.x, y: this._pointerStart.y }
		} );
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
