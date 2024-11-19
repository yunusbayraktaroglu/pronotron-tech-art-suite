import { PronotronPointerBase } from "./PronotronPointerBase";

export class PronotronTouch extends PronotronPointerBase 
{
	startEvents()
	{
		this._addEventListeners(
			[ "touchstart", this._onPointerStart ],
		);

		super._startEvents();
	}

	stopEvents()
	{
		this._removeEventListeners(
			[ "touchstart", this._onPointerStart ],
			[ "touchmove", this._onPointerMove ],
			[ "touchend", this._onPointerEnd ],
		);

		super._stopEvents();
	}

	_onPointerStart( event: TouchEvent ): void
	{
		this._addEventListeners(
			[ "touchmove", this._onPointerMove ],
			[ "touchend", this._onPointerEnd ],
		);

		const { x, y } = this._getPointerPosition( event );
		this._pointerStart.set( x, y );

		super._onPointerStart( event );
	}

	_onPointerEnd( event: TouchEvent ): void
	{
		this._removeEventListeners(
			[ "touchmove", this._onPointerMove ],
			[ "touchend", this._onPointerEnd ],
		);

		super._onPointerEnd( event );
	}

	_onPointerMove( event: TouchEvent ): void
	{
		const { x, y } = this._getPointerPosition( event );
		this._updatePointer( x, y );

		super._onPointerMove( event );
    }

	_getPointerPosition( event: TouchEvent ): { x: number; y: number }
	{
		return { 
			x: event.touches[ 0 ].clientX, 
			y: event.touches[ 0 ].clientY 
		};
	}

}