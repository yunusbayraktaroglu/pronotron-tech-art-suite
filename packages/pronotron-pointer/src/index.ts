// Factory functions
export { createBasePointer } from "./factories/createBasePointer";
export { createHoldablePointer } from "./factories/createHoldablePointer";

export { 
	type BaseSettings,
	type PointerBaseDependencies, 
	type TapEventDetail,
} from "./core/interaction/PointerBase";

export { 
	type HoldableSettings, 
	type PointerHoldableDependencies, 
	type HoldEventDetail, 
	type ReleaseEventDetail,
} from "./core/interaction/PointerHoldable";