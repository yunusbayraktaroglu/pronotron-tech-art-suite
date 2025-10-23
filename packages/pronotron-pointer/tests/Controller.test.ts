import { PronotronAnimator, PronotronClock } from '@pronotron/utils';

import { MouseController } from '../src/core/model/Mouse';
import { TouchController } from '../src/core/model/Touch';
import { PointerBase, PointerState, PointerBaseDependencies } from '../src/core/PointerBase';
import { PointerHoldable, PointerHoldableDependencies } from '../src/core/PointerHoldable';

jest.mock( '@pronotron/utils' );
jest.mock( '../src/core/PointerBase' );
jest.mock( '../src/core/PointerHoldable' );

const MockedPointerBase = PointerBase as jest.MockedClass<typeof PointerBase>;
const MockedPointerHoldable = PointerHoldable as jest.MockedClass<typeof PointerHoldable>;
const MockedAnimator = PronotronAnimator as jest.MockedClass<typeof PronotronAnimator>;
const MockedClock = PronotronClock as jest.MockedClass<typeof PronotronClock>;

/**
 * Workaround for {@link PointerBase._isRunning} behavior.
 * 
 * Since PointerBase is mocked, its internal _isRunning state check
 * (which prevents event listeners from being registered multiple times)
 * does not run. This manual flag simulates the same logic.
 */
let isRunning = false;
MockedPointerBase.prototype._startEvents = jest.fn(() => {
	if ( isRunning ){
		return false;
	} else {
		isRunning = true;
		return true;
	}
});

describe( 'Pointer Controller Initialization Logic', () => {
	
	let mockTarget: HTMLElement;
	let mockAnimator: PronotronAnimator;
	let mockClock: PronotronClock;

	beforeEach( () => {

		// 1. Restores all 'jest.spyOn' mocks to their original implementation
		jest.restoreAllMocks();

		// 2. Clears the call history for all other mocks (jest.fn, jest.mock)
		jest.clearAllMocks();
		
		mockTarget = document.body;
		mockClock = new MockedClock();
		mockAnimator = new MockedAnimator( mockClock );

		isRunning = false;

	} );

	const getBaseDependencies = () => ( {
		target: mockTarget,
		animator: mockAnimator,
		clock: mockClock,
		idleThreshold: 0.5,
		tapThreshold: 0.25,
		movingDeltaLimit: 10,
		isInteractable: () => false,
	} satisfies PointerBaseDependencies );

	const getHoldableDependencies = () => ( {
		...getBaseDependencies(),
		holdThreshold: 0.25,
		isHoldable: () => true
	} satisfies PointerHoldableDependencies );

	test( 'MouseController should instantiate PointerBase when holdThreshold is not provided', () => {

		new MouseController( getBaseDependencies() );

		expect( MockedPointerBase ).toHaveBeenCalledTimes( 1 );
		expect( MockedPointerHoldable ).not.toHaveBeenCalled();

	} );

	test( 'MouseController should instantiate PointerHoldable when holdThreshold is provided', () => {

		new MouseController( getHoldableDependencies() );

		expect( MockedPointerHoldable ).toHaveBeenCalledTimes( 1 );
		expect( MockedPointerBase ).not.toHaveBeenCalled();

	} );

	test( 'TouchController should instantiate PointerBase when holdThreshold is not provided', () => {

		new TouchController( getBaseDependencies() );

		expect( MockedPointerBase ).toHaveBeenCalledTimes( 1 );
		expect( MockedPointerHoldable ).not.toHaveBeenCalled();

	} );

	test( 'TouchController should instantiate PointerHoldable when holdThreshold is provided', () => {

		new TouchController( getHoldableDependencies() );

		expect( MockedPointerHoldable ).toHaveBeenCalledTimes( 1 );
		expect( MockedPointerBase ).not.toHaveBeenCalled();

	} );
	
} );