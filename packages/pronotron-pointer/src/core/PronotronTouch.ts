import { PointerStates, PronotronPointerBase } from "./PronotronPointerBase";

/**
 * The movementX and movementY properties in PointerEvent are not supported in Safari on iOS, including on an iPhone 6. 
 * These properties are more commonly supported in desktop environments and are used to measure the change in the pointer's position between two events, 
 * such as when moving a mouse.
 * 
 * To support old devices like iphone6, we are manually calculating delta.
 */
export class PronotronTouch extends PronotronPointerBase 
{
	startEvents()
	{
		this._target.addEventListener( "touchstart", this._onStart as EventListener, { passive: false } );
		super._startEvents();
	}

	stopEvents()
	{
		this._target.removeEventListener( "touchstart", this._onStart as EventListener );
		this._target.removeEventListener( "touchmove", this._onMove as EventListener );
		this._target.removeEventListener( "touchend", this._onEnd as EventListener );
		super._stopEvents();
	}

	_onStart( event: TouchEvent ): void
	{
		super._onStart( event );

		this._target.addEventListener( "touchmove", this._onMove as EventListener, { passive: false } );
		this._target.addEventListener( "touchend", this._onEnd as EventListener, { passive: false } );

		const { x, y } = this._getPointerPosition( event );
		this._pointerStart.set( x, y );
	}

	_onMove( event: TouchEvent ): void
	{
		super._onMove( event );
		const { x, y } = this._getPointerPosition( event );
		this._updatePointer( x, y );
    }

	_onEnd( event: TouchEvent ): void
	{
		this._target.removeEventListener( "touchmove", this._onMove as EventListener );
		this._target.removeEventListener( "touchend", this._onEnd as EventListener );
		super._onEnd( event );
		this._currentState = PointerStates.IDLE;
	}

	_getPointerPosition( event: TouchEvent ): { x: number; y: number }
	{
		return { 
			x: event.touches[ 0 ].clientX, 
			y: event.touches[ 0 ].clientY 
		};
	}

}