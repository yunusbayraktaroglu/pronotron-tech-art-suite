import { isTouchDevice } from "@pronotron/utils";
import { PointerBase, PointerBaseDependencies } from "../core/interaction/PointerBase";
import { MouseController } from "../core/input/Mouse";
import { TouchController } from "../core/input/Touch";

type Model = "touch" | "mouse";

/**
 * Returns base PointerController. Internally uses {@link isTouchDevice} to decide
 * return "touch" or "mouse" controller. Or second parameter can be used.
 * 
 * @param settings {@link PointerBaseDependencies}
 * @param model {@link Model}
 * 
 * @example
 * const clock = new PronotronClock();
 * const animator = new PronotronAnimator( clock );
 * const pointer = createBasePointer({
 * 	tapThreshold: 0.25,
 * 	idleThreshold: 0.5,
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
 * 	}
 * });
 * 
 * // Start pointer
 * pointer.startEvents();
 * // Stop pointer
 * pointer.stopEvents();
 */
export function createBasePointer( settings: PointerBaseDependencies, model?: Model )
{
	const isTouch = model ? ( model === "touch" ) : isTouchDevice();
	
	const pointerModel = new PointerBase( settings );
	const pointerController = isTouch ? new TouchController( pointerModel ) : new MouseController( pointerModel );

	return pointerController;
}