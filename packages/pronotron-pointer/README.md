# @pronotron/pointer

Tracks mouse and touch pointers with custom states such as holding, tapping, idling, interacting, moving out, and moving in, providing enhanced interaction control.

### Setup
```typescript
import { TouchBase, TouchHoldable, MouseHoldable, MouseBase } from "@pronotron/pointer";
import { PronotronAnimationController, PronotronClock, isTouchDevice } from "@pronotron/utils";

const clock = new PronotronClock();
const animationController = new PronotronAnimationController( clock );

const pointerController = new MouseHoldable({
	target: window.document.body,
	clock: clock,
	animationController: animationController,
	isInteractable: ( target: HTMLElement ) => {
		return target.classList.contains( "holdable" ) || target.tagName === "A";
	},
	idleTreshold: 0.5,
	holdTreshold: 0.35,
	isHoldable: ( target: HTMLElement ) => {
		return target.dataset.holdable ? true : false;
	}
});

const holdHandler = ( event: CustomEvent ) => {
	console.log( "HOLD", event )
};
const holdendHandler = ( event: CustomEvent ) => {
	console.log( "HOLD-END", event )
};
const tapHandler = ( event: CustomEvent ) => {
	console.log( "TAP", event )
};

window.document.body.addEventListener( "hold", holdHandler as EventListener );
window.document.body.addEventListener( "holdend", holdendHandler as EventListener );
window.document.body.addEventListener( "tap", tapHandler as EventListener );
```

### Running

```typescript
pointerController.startEvents();

let animationFrameId = 0;

function tick()
{
	const deltaTime = clock.tick();
	animationController.tick();

	setPointer( pointerController.getPosition() );
	setPointerDelta( pointerController.getMovement() );
	setPointerState( pointerController.getCurrentState() );
	setPointerTargetInteractable( pointerController.getTargetInteractable() );

	animationFrameId = requestAnimationFrame( tick );
};

animationFrameId = requestAnimationFrame( tick );
```