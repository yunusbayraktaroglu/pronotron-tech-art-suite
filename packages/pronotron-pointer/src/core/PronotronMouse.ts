import { PronotronPointerBase } from "./PronotronPointerBase";

export class PronotronMouse extends PronotronPointerBase 
{
	/**
	 * Only in mouse,
	 * onMove firing 1 times when onEnd executed, if pointerdown is fired while onMove.
	 * Skip onMove caused by onEnd.
	 * @internal
	 */
	private _skipMove = false;

	/**
	 * Activates events for start
	 */
	startEvents(): void
	{
		super._startEvents();

		this._addEventListeners(
			[ "pointerdown", this._onPointerStart ],
			[ "pointermove", this._onPointerMove ],
			[ "dragstart", this._onDragStart ],
		);
	}

	/**
	 * Clean all related events for disposal
	 */
	stopEvents(): void
	{
		super._stopEvents();

		this._removeEventListeners(
			[ "pointerdown", this._onPointerStart ],
			[ "pointermove", this._onPointerMove ],
			[ "pointerup", this._onPointerEnd ],
			[ "pointercancel", this._onPointerEnd ],
			[ "dragstart", this._onDragStart ],
			[ "dragover", this._onPointerMove ],
			[ "dragend", this._onDragEnd ],
		);
	}


	/**
	 * Drag events
	 * @internal
	 */
	protected _onDragStart( event: MouseEvent ): void
	{
		this._addEventListeners(
			[ "dragover", this._onMove ],
			[ "dragend", this._onDragEnd ],
		);
		
		super._onDragStart( event );
	}

	protected _onDragEnd( event: MouseEvent ): void
	{
		this._removeEventListeners(
			[ "dragover", this._onMove ],
			[ "dragend", this._onDragEnd ],
		);

		super._onDragEnd( event );
	}

	/**
	 * Pointer events
	 * @internal
	 */
	protected _onPointerStart( event: MouseEvent ): void
	{
		this._addEventListeners(
			[ "pointerup", this._onPointerEnd ],
			[ "pointercancel", this._onPointerEnd ],
		);

		super._onPointerStart( event );
	}

	protected _onPointerEnd( event: MouseEvent ): void
	{
		/**
		 * Only in mouse,
		 * onMove firing 1 times when onEnd executed, if pointerdown is fired while onMove.
		 * Skip onMove caused by onEnd.
		 */
		this._skipMove = true;

		this._removeEventListeners(
			[ "pointerup", this._onPointerEnd ],
			[ "pointercancel", this._onPointerEnd],
		);

		super._onPointerEnd( event );
	}

	protected _onMove( event: MouseEvent ): void
	{
		/**
		 * Only in mouse,
		 * onMove is firing 1 times when onEnd executed, if pointerdown is fired while onMove.
		 * Skip onMove caused by onEnd.
		 */
		if ( this._skipMove ){
			this._skipMove = false;
			return;
		};

		const { x, y } = this._getPointerPosition( event );
		this._updatePointer( x, y );

		super._onPointerMove( event );
    }

	_getPointerPosition( event: MouseEvent ): { x: number; y: number }
	{
		return { 
			x: event.clientX, 
			y: event.clientY 
		};
	}
}