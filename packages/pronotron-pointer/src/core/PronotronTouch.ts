import { PointerStates, PronotronPointerBase } from "./PronotronPointerBase";

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
		this._target.addEventListener( "touchmove", this._onMove as EventListener, { passive: false } );
		this._target.addEventListener( "touchend", this._onEnd as EventListener, { passive: false } );

		const { x, y } = this._getPointerPosition( event );
		this._pointerStart.set( x, y );

		super._onStart( event );
	}

	_onMove( event: TouchEvent ): void
	{
		const { x, y } = this._getPointerPosition( event );
		this._updatePointer( x, y );

		super._onMove( event );
    }

	_onEnd( event: TouchEvent ): void
	{
		this._target.removeEventListener( "touchmove", this._onMove as EventListener );
		this._target.removeEventListener( "touchend", this._onEnd as EventListener );
		super._onEnd( event );
	}

	_getPointerPosition( event: TouchEvent ): { x: number; y: number }
	{
		return { 
			x: event.touches[ 0 ].clientX, 
			y: event.touches[ 0 ].clientY 
		};
	}

}