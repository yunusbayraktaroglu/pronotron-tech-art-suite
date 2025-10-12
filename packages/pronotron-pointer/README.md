# @pronotron/pointer

[![NPM Package][npm]][npm-url]
[![Build Size][build-size]][build-size-url]

Tracks mouse and touch pointers with custom states such as holding, tapping, idling, interacting, moving out, and moving in, providing enhanced interaction control.

### Setup
```typescript
import { MouseController, TouchController } from "@pronotron/pointer";
import { PronotronAnimator, PronotronClock, isTouchDevice } from "@pronotron/utils";

const clock = new PronotronClock();
const animator = new PronotronAnimator( clock );

/**
 * Or create a touch controller if
 * isTouchDevice(); 
 */
const pointerController = new MouseController({
	target: window.document.body,
	clock: clock,
	animator: animator,
	idleThreshold: 0.5,
	tapThreshold: 0.25,
	holdThreshold: 0.75,
	movingDeltaLimit: 10,
	isInteractable: ( target: HTMLElement ) => {
		return target.classList.contains( "holdable" ) || target.tagName === "A";
	},
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

### Usage

```typescript
pointerController.startEvents();

let animationFrameId = 0;

function tick()
{
	const deltaTime = clock.tick();
	animator.tick();

	const pointerPosition = pointerController.getPosition();
	const pointerDelta = pointerController.getDelta();
	const pointerState = pointerController.getState();
	const isPointerTargetInteractable = pointerController.getTargetInteractable();    

	animationFrameId = requestAnimationFrame( tick );
};

animationFrameId = requestAnimationFrame( tick );

// Dispose
// pointerController.stopEvents();
```

[npm]: https://img.shields.io/npm/v/@pronotron/pointer
[npm-url]: https://www.npmjs.com/package/@pronotron/pointer
[build-size]: https://badgen.net/bundlephobia/minzip/@pronotron/pointer
[build-size-url]: https://bundlephobia.com/result?p=@pronotron/pointer