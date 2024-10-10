import { Vector2 } from "./Vector2";

import { PronotronAnimationController } from "@pronotron/utils";
import { PronotronClock } from "@pronotron/utils";

export abstract class PronotronPointerBase
{
	clock: PronotronClock;
	isRunning: boolean = false;

	target: HTMLElement | Window;
	animationController: PronotronAnimationController;

	_pointerStart = new Vector2();
	_pointerEnd = new Vector2();
	_pointerDelta = new Vector2();
	
	abstract getPointerPosition( event: Event ): { x: number; y: number };
	
	abstract onStart( event: Event ): void;
	abstract onMove( event: Event ): void;
	abstract onEnd( event: Event ): void;

	constructor( target: HTMLElement | Window, animationController: PronotronAnimationController, clock: PronotronClock )
	{
		this.target = target;
		this.animationController = animationController;
		this.clock = clock;

		this.onStart = this.onStart.bind( this );
		this.onMove = this.onMove.bind( this );
		this.onEnd = this.onEnd.bind( this );
	}

	/**
	 * Updates pointer "start", "end", and "delta" between start-end values
	 */
	updatePointer( x: number, y: number ): void
	{
		this._pointerEnd.set( x, y );
		this._pointerDelta.subVectors( this._pointerEnd, this._pointerStart );
		this._pointerStart.copy( this._pointerEnd );
	}
}
