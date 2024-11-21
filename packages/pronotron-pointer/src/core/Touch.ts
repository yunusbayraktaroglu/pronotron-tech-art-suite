import { PointerBase, CommonDependencies } from "./PointerBase";
import { PointerHoldable, PointerHoldableDependencies } from "./PointerHoldable";

type Constructor<T = {}> = new (...args: any[]) => T;

/** @internal */
function Touch<TBase extends Constructor<PointerBase<any>>>( Base: TBase )
{
	return class MouseBase extends Base 
	{
		constructor( ...args: any[] )
		{
			super( ...args );
		}

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
			this._pointerStart._set( x, y );
	
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
	};
}

export class TouchBase extends Touch<typeof PointerBase<any>>( PointerBase )
{
	constructor( dependencies: CommonDependencies )
	{
		super( dependencies );
	}
}

export class TouchHoldable extends Touch<typeof PointerBase<any>>( PointerHoldable )
{
	constructor( dependencies: PointerHoldableDependencies )
	{
		super( dependencies );
	}
}