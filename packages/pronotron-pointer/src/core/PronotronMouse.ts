import { PronotronPointerBase } from "./PronotronPointerBase";

type MouseStates = "idle" | "started" | "moving" | "holding" | "tap";

/**
 * The movementX and movementY properties in PointerEvent are not supported in Safari on iOS, including on an iPhone 6. 
 * These properties are more commonly supported in desktop environments and are used to measure the change in the pointer's position between two events, 
 * such as when moving a mouse.
 * 
 * To support old devices like iphone6, we are manually calculating delta.
 */
export class PronotronMouse extends PronotronPointerBase 
{
	currentState: MouseStates = "idle";

	startEvents()
	{
		this.target.addEventListener( "pointermove", this.onMove as EventListener, { passive: false } );
		this.currentState = "started";
		this.isRunning = true;
	}

	stopEvents()
	{
		this.target.removeEventListener( "pointermove", this.onMove as EventListener );
		this.currentState = "idle";
		this.isRunning = false;
	}

	onStart( event: MouseEvent ): void {}
	onEnd( event: MouseEvent ): void {}
	onMove( event: MouseEvent ): void
	{
		this.currentState = "moving";

		const { x, y } = this.getPointerPosition( event );

		this.updatePointer( x, y );
    }

	getPointerPosition( event: MouseEvent ): { x: number; y: number }
	{
		return { 
			x: event.clientX, 
			y: event.clientY 
		};
	}

}







