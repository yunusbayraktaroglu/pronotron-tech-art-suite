import { PointerStates, PronotronPointerBase } from "./PronotronPointerBase";

/**
 * The movementX and movementY properties in PointerEvent are not supported in Safari on iOS, including on an iPhone 6. 
 * These properties are more commonly supported in desktop environments and are used to measure the change in the pointer's position between two events, 
 * such as when moving a mouse.
 * 
 * To support old devices like iphone6, we are manually calculating delta.
 */
export class PronotronMouse extends PronotronPointerBase 
{
	startEvents(): void
	{
		super._startEvents();
		this._target.addEventListener( "pointermove", this._onMove as EventListener, { passive: false } );
		this._target.addEventListener( "pointerdown", this._onStart as EventListener, { passive: false } );
		/**
		 * Dragging event causes missing pointerup listener, and fires pointercancel event.
		 * @see https://stackoverflow.com/questions/68932661/js-event-listeners-stop-working-during-item-drag-only-fire-after-pointerup-and
		 */
		this._target.addEventListener( "dragstart", ( event ) => event.preventDefault() );
		this._currentState = PointerStates.MOVING;
	}

	stopEvents(): void
	{
		super._stopEvents();
		this._target.removeEventListener( "pointermove", this._onMove as EventListener );
		this._target.removeEventListener( "pointerdown", this._onStart as EventListener );
		this._target.removeEventListener( "pointerup", this._onEnd as EventListener );
		this._target.removeEventListener( "pointercancel", this._onEnd as EventListener );
		this._currentState = PointerStates.IDLE;
	}

	_onStart( event: MouseEvent ): void
	{
		this._target.addEventListener( "pointerup", this._onEnd as EventListener, { passive: false } );
		super._onStart( event );
	}

	_onMove( event: MouseEvent ): void
	{
		super._onMove( event );
		const { x, y } = this._getPointerPosition( event );
		this._updatePointer( x, y );
    }

	_onEnd( event: MouseEvent ): void
	{
		this._target.removeEventListener( "pointerup", this._onEnd as EventListener );
		this._target.removeEventListener( "pointercancel", this._onEnd as EventListener );
		super._onEnd( event );
		this._currentState = PointerStates.MOVING;
	}

	_getPointerPosition( event: MouseEvent ): { x: number; y: number }
	{
		return { 
			x: event.clientX, 
			y: event.clientY 
		};
	}
}