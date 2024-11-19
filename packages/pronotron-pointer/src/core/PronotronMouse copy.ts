import { PointerStates, PronotronPointerBase } from "./PronotronPointerBase";

export class PronotronMouse extends PronotronPointerBase 
{
	/**
	 * Only in mouse,
	 * onMove firing 1 times when onEnd executed, if pointerdown is fired while onMove.
	 * Skip onMove caused by onEnd.
	 * @internal
	 */
	private _skipMove = false;

	test()
	{
		this.addEventListeners([
			[ "pointerdown", this._onStart as EventListener ],
			[ "pointermove", this._onMove as EventListener ],
			[ "pointerup", this._onEnd as EventListener ],
			[ "pointercancel", this._onEnd as EventListener ],
			[ "dragstart", this._onDragStart as EventListener ],
			[ "dragover", this._onMove as EventListener ],
			[ "dragend", this._onDragEnd as EventListener ],
		]);
	}

	startEvents(): void
	{
		this._target.addEventListener( "pointerdown", this._onStart as EventListener );
		this._target.addEventListener( "pointermove", this._onMove as EventListener );

		this._target.addEventListener( "dragstart", this._onDragStart as EventListener );

		super._startEvents();

	}

	stopEvents(): void
	{
		this._target.removeEventListener( "pointerdown", this._onStart as EventListener );
		this._target.removeEventListener( "pointermove", this._onMove as EventListener );
		this._target.removeEventListener( "pointerup", this._onEnd as EventListener );
		this._target.removeEventListener( "pointercancel", this._onEnd as EventListener );

		this._target.removeEventListener( "dragstart", this._onDragStart as EventListener );
		this._target.removeEventListener( "dragover", this._onMove as EventListener );
		this._target.removeEventListener( "dragend", this._onDragEnd as EventListener );

		super._stopEvents();
	}

	_onDragStart( event: MouseEvent ): void
	{
		this._target.addEventListener( "dragover", this._onMove as EventListener );
		this._target.addEventListener( "dragend", this._onDragEnd as EventListener );
		
		super._onDragStart( event );
	}

	_onDragEnd( event: MouseEvent ): void
	{
		this._target.removeEventListener( "dragover", this._onMove as EventListener );
		this._target.removeEventListener( "dragend", this._onDragEnd as EventListener );

		super._onDragEnd( event );
	}

	_onStart( event: MouseEvent ): void
	{
		this._target.addEventListener( "pointerup", this._onEnd as EventListener );
		this._target.addEventListener( "pointercancel", this._onEnd as EventListener );

		super._onStart( event );
	}

	_onEnd( event: MouseEvent ): void
	{
		/**
		 * Only in mouse,
		 * onMove firing 1 times when onEnd executed, if pointerdown is fired while onMove.
		 * Skip onMove caused by onEnd.
		 */
		this._skipMove = true;

		this._target.removeEventListener( "pointerup", this._onEnd as EventListener );
		this._target.removeEventListener( "pointercancel", this._onEnd as EventListener );

		super._onEnd( event );
	}

	_onMove( event: MouseEvent ): void
	{
		/**
		 * Only in mouse,
		 * onMove firing 1 times when onEnd executed, if pointerdown is fired while onMove.
		 * Skip onMove caused by onEnd.
		 */
		if ( this._skipMove ){
			this._skipMove = false;
			return;
		};

		const { x, y } = this._getPointerPosition( event );
		this._updatePointer( x, y );

		super._onMove( event );
    }

	_getPointerPosition( event: MouseEvent ): { x: number; y: number }
	{
		return { 
			x: event.clientX, 
			y: event.clientY 
		};
	}
}