import { PronotronPointerBase } from "./PronotronPointerBase";

type TouchStates = "idle" | "started" | "moving" | "holding" | "tap";

/**
 * The movementX and movementY properties in PointerEvent are not supported in Safari on iOS, including on an iPhone 6. 
 * These properties are more commonly supported in desktop environments and are used to measure the change in the pointer's position between two events, 
 * such as when moving a mouse.
 * 
 * To support old devices like iphone6, we are manually calculating delta.
 */
export class PronotronTouch extends PronotronPointerBase 
{
	currentState: TouchStates = "idle";

	_pointerStartTime = 0;
	_tapTreshold = 0.3;
	_holdTreshold = 0.35;

	_holding = false;
	_canHold = true;

	startEvents()
	{
		this.target.addEventListener( "touchstart", this.onStart as EventListener, { passive: false } );
		this.isRunning = true;
	}

	stopEvents()
	{
		this.target.removeEventListener( "touchstart", this.onStart as EventListener );
		this.target.removeEventListener( "touchmove", this.onMove as EventListener );
		this.target.removeEventListener( "touchend", this.onEnd as EventListener );
		this.isRunning = false;
	}

	onStart( event: TouchEvent ): void
	{
		this.target.addEventListener( "touchmove", this.onMove as EventListener, { passive: false } );
		this.target.addEventListener( "touchend", this.onEnd as EventListener, { passive: false } );

		this.currentState = "started";

		const { x, y } = this.getPointerPosition( event );

		this._canHold = true;
		this._holding = false;

		this._pointerStart.set( x, y );
		this._pointerStartTime = this.clock.elapsedTime;

		this.animationController.addAnimation({
			id: "TOUCH_HOLDING",
			duration: this._holdTreshold,
			timeStyle: "continious",
			forceFinish: "doNotRunOnEnd",
			onEnd: () => {
				this.convertToHold( event );
			}
		});
	}

	onMove( event: TouchEvent ): void
	{
		/**
		 * Disable touch scroll if holding
		 */
		if ( this._holding ){
			event.preventDefault();
		}

		const { x, y } = this.getPointerPosition( event );

		this.updatePointer( x, y );

		/**
		 * Check if movement is too big, user is moving pointer
		 */
		if ( this._canHold && this._pointerDelta.lengthSq() > 1 ){
			this._canHold = false;
			this.currentState = "moving";
			console.log( "cant hold anymore" );
		}
    }

	onEnd( event: TouchEvent ): void
	{
		this._canHold = false;
		this._holding = false;

		this.target.removeEventListener( "touchmove", this.onMove as EventListener );
		this.target.removeEventListener( "touchend", this.onEnd as EventListener );

		if ( this.clock.elapsedTime < this._pointerStartTime + this._tapTreshold ){
			this.currentState = "tap";
			this.target.dispatchEvent( new CustomEvent( "tap", { 
				detail: {
					target: event.target,
					position: this._pointerStart
				} 
			} ));
		}

		this.currentState = "idle";
	}

	convertToHold( event: TouchEvent ): void
	{
		if ( this._canHold ){
			this.currentState = "holding";
			this._holding = true;
			this._canHold = false;
			this.target.dispatchEvent( new CustomEvent( "hold", { 
				detail: {
					target: event.target,
					position: this._pointerStart
				} 
			} ));
		}
	}

	getPointerPosition( event: TouchEvent ): { x: number; y: number }
	{
		return { 
			x: event.touches[ 0 ].clientX, 
			y: event.touches[ 0 ].clientY 
		};
	}

}