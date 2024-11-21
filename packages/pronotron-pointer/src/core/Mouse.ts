import { PointerStates, PointerBase, CommonDependencies } from "./PointerBase";
import { PointerHoldable, PointerHoldableDependencies } from "./PointerHoldable";

type Constructor<T = {}> = new (...args: any[]) => T;

/** @internal */
function Mouse<TBase extends Constructor<PointerBase<any>>>( Base: TBase )
{
	return class MouseBase extends Base 
	{
		/**
		 * Only in mouse,
		 * onMove firing 1 times when onEnd executed, if pointerdown is fired while onMove.
		 * Skip onMove caused by onEnd.
		 * @internal
		 */
		_skipMove = false;

		constructor( ...args: any[] )
		{
			super( ...args );
			
			this._onPointerLeave = this._onPointerLeave.bind( this );
			this._onDragStart = this._onDragStart.bind( this );
			this._onDragEnd = this._onDragEnd.bind( this );
		}

		/** @internal */
		_getPointerPosition( event: MouseEvent ): { x: number; y: number }
		{
			return { 
				x: event.clientX, 
				y: event.clientY 
			};
		}

		/** @internal */
		_onPointerLeave( event: MouseEvent ): void
		{
			this._currentState = PointerStates.OUT;
		}

		/**
		 * Activates events for start
		 */
		startEvents(): void
		{
			super._startEvents();
			this._addEventListeners(
				[ "pointerdown", this._onPointerStart ],
				[ "pointermove", this._onPointerMove ],
				[ "pointerleave", this._onPointerLeave ],
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
				[ "pointerleave", this._onPointerLeave ],
				[ "dragstart", this._onDragStart ],
				[ "dragover", this._onPointerMove ],
				[ "dragend", this._onDragEnd ],
			);
		}

		/**
		 * Pointer events
		 * @internal
		 */
		 _onPointerStart( event: MouseEvent ): void
		{
			this._addEventListeners(
				[ "pointerup", this._onPointerEnd ],
				[ "pointercancel", this._onPointerEnd ],
			);
			super._onPointerStart( event );
		}

		/** @internal */
		_onPointerEnd( event: MouseEvent ): void
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

			// Dragstart event releases pointerdown, return early without changing state
			if ( this._currentState === PointerStates.DRAG ){
				return;
			}

			super._onPointerEnd( event );
		}

		/**
		 * @internal
		 */
		_onPointerMove( event: MouseEvent ): void
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

			// Native dragover(dragging) is connected to _onPointerMove, we only updating the pointer position
			if ( this._currentState === PointerStates.DRAG ){
				return;
			}

			if ( this._currentState === PointerStates.OUT ){
				this._currentState = PointerStates.MOVING;
			}

			super._onPointerMove( event );
		}


		/**
		 * While holding select-none class is added that disables drag operation
		 * Previous may only be: WAITING or MOVING
		 * @internal
		 */
		_onDragStart( event: Event ): void
		{
			this._addEventListeners(
				[ "dragover", this._onPointerMove ],
				[ "dragend", this._onDragEnd ],
			);
			this._currentState = PointerStates.DRAG;
		}

		/**
		 * @internal
		 */
		_onDragEnd( event: Event ): void
		{
			this._removeEventListeners(
				[ "dragover", this._onPointerMove ],
				[ "dragend", this._onDragEnd ],
			);
			this._currentState = PointerStates.IDLE;
		}
	
	};
}

export class MouseBase extends Mouse<typeof PointerBase<never>>( PointerBase )
{
	constructor( dependencies: CommonDependencies )
	{
		super( dependencies );
	}
}

export class MouseHoldable extends Mouse<typeof PointerHoldable>( PointerHoldable )
{
	constructor( dependencies: PointerHoldableDependencies )
	{
		super( dependencies );
	}
}