import { isTouchDevice } from "@pronotron/utils";
import { PointerHoldable, PointerHoldableDependencies } from "../core/interaction/PointerHoldable";
import { MouseController } from "../core/input/Mouse";
import { TouchController } from "../core/input/Touch";

type Model = "touch" | "mouse";

/**
 * Returns holdable PointerController. Internally uses {@link isTouchDevice} to decide
 * return "touch" or "mouse" controller. Or second parameter can be used.
 * 
 * @param settings {@link PointerHoldableDependencies}
 * @param model {@link Model}
 *  
 * @example
 * const clock = new PronotronClock();
 * const animator = new PronotronAnimator( clock );
 * const pointer = createHoldablePointer({
 * 	tapThreshold: 0.25,
 * 	idleThreshold: 0.5,
 * 	holdThreshold: 0.75,
 * 	movingDeltaLimit: 10,
 * 	target: window.document.body,
 * 	clock: clock,
 * 	animator: animator,
 * 	isInteractable: ( target: HTMLElement ) => {
 * 		// If target inside an <a>, <button> or .holdable return true
 * 		if ( target.closest( "a" ) || target.closest( "button" ) || target.closest( ".holdable" ) ){
 * 			return true;
 * 		}
 * 		return false;
 * 	},
 * 	isHoldable: ( target: HTMLElement ) => {
 * 		return target.dataset.holded ? true : false;
 * 	}
 * });
 * 
 * // Start pointer
 * pointer.startEvents();
 * // Stop pointer
 * pointer.stopEvents();
 */
export function createHoldablePointer( settings: PointerHoldableDependencies, model?: Model )
{
	const isTouch = model ? ( model === "touch" ) : isTouchDevice();
	
	const pointerModel = new PointerHoldable( settings );
	const pointerController = isTouch ? new TouchController( pointerModel ) : new MouseController( pointerModel );

	return pointerController;
}