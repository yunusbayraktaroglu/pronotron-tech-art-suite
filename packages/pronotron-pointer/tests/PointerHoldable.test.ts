import { PronotronAnimator, PronotronClock } from '@pronotron/utils';

import { PointerState } from '../src/core/PointerBase';
import { PointerHoldable } from '../src/core/PointerHoldable';

jest.mock( '@pronotron/utils' );

const MockedAnimator = PronotronAnimator as jest.MockedClass<typeof PronotronAnimator>;
const MockedClock = PronotronClock as jest.MockedClass<typeof PronotronClock>;
MockedClock.prototype.getTime = jest.fn().mockReturnValue( { elapsedTime: 0 } );

describe( 'PointerHoldable', () => {

	let mockTarget: HTMLElement;
	let mockAnimator: PronotronAnimator;
	let mockClock: PronotronClock;
	let pointerHoldable: PointerHoldable;
	
	let isInteractable: jest.Mock = jest.fn().mockImplementation( ( target: HTMLElement ) => false );
	let isHoldable: jest.Mock = jest.fn().mockImplementation( ( target: HTMLElement ) => target.tagName === 'BUTTON' );

	const holdableElement = document.createElement( 'button' );
	const nonHoldableElement = document.createElement( 'div' );

	const idleThreshold = 0.5;
	const tapThreshold = 0.25;
	const movingDeltaLimit = 20;
	const holdThreshold = 0.5;

	beforeAll( () => {

		mockTarget = document.body;
		mockClock = new MockedClock();
		mockAnimator = new MockedAnimator( mockClock );
		
		pointerHoldable = new PointerHoldable( {
			target: mockTarget,
			animator: mockAnimator,
			clock: mockClock,
			idleThreshold,
			tapThreshold,
			movingDeltaLimit,
			holdThreshold,
			isInteractable,
			isHoldable,
		} );

	} );

	// Utility to create a synthetic DOM event with mocked propagation methods
	const createMockEvent = ( target: EventTarget ) => ( {
		target,
		preventDefault: jest.fn(),
		stopPropagation: jest.fn(),
		stopImmediatePropagation: jest.fn(),
	} ) as unknown as Event;

	describe( 'Initialization', () => {

		beforeAll( () => {
			jest.restoreAllMocks();
			jest.spyOn( mockTarget, 'dispatchEvent' );
		} );

		it( 'should initialize with correct default state values', () => {

			expect( pointerHoldable._isRunning ).toBe( false );
			expect( pointerHoldable._canHold ).toBe( false );
			expect( pointerHoldable._currentState ).toBe( PointerState.IDLE );

		} );

		it( 'should ignore on non-holdable targets', () => {

			pointerHoldable._startEvents();
			pointerHoldable._onPointerStart( createMockEvent( nonHoldableElement ) );
			
			expect( pointerHoldable._canHold ).toBe( false );

			pointerHoldable._onPointerEnd( createMockEvent( nonHoldableElement ) );
			pointerHoldable._stopEvents();

		} );

	} );

	describe( 'Holdable Lifecycle', () => {

		beforeAll( () => {

			jest.restoreAllMocks();
			jest.spyOn( mockTarget, 'dispatchEvent' );
			
			pointerHoldable._startEvents();

			// Start pointer on a holdable, sets pointer start position as [0, 0], pointer start time as 0
			pointerHoldable._onPointerStart( createMockEvent( holdableElement ) );

		} );

		it( 'should schedule HOLD animation when target is holdable', () => {
			
			expect( pointerHoldable._isRunning ).toBe( true );
			expect( pointerHoldable._currentState ).toBe( PointerState.PENDING );
			expect( mockAnimator.add ).toHaveBeenCalledWith( expect.objectContaining( { id: 'HOLD', duration: holdThreshold } ) );
			expect( pointerHoldable._canHold ).toBe( true );

		} );

		it( 'should dispatch "HOLD" event when holdThreshold is exceeded', () => {

			// Advance time by more than the hold threshold
			mockClock.getTime = jest.fn().mockReturnValue( { elapsedTime: holdThreshold + 0.01 } );

			/**
			 * HOLD Animation options passed to animator
			 * {
			 * 	id: 'HOLD',
			 * 	duration: number,
			 * 	autoPause: false,
			 * 	onEnd: [Function: onEnd]
			 * }
			 */
			const scheduledAnimationOptions = jest.mocked( mockAnimator.add ).mock.lastCall![ 0 ];

			// Manually invoke the onEnd callback to simulate animation completion
			scheduledAnimationOptions.onEnd!( false );

			// The "hold" event should be dispatched
			expect( mockTarget.dispatchEvent ).toHaveBeenCalledWith( expect.any( CustomEvent ) );

			const dispatchedEvent = jest.mocked( mockTarget.dispatchEvent ).mock.lastCall![ 0 ] as CustomEvent;
			
			expect( pointerHoldable._currentState ).toBe( PointerState.HOLDING );
			expect( dispatchedEvent.type ).toBe( 'hold' );
			expect( dispatchedEvent.detail.target ).toBe( holdableElement );
			expect( holdableElement.dataset.holded ).toBe( '1' );
			
		} );

		it ( 'should transition from "HOLD → HOLD_DRAGGING" when moving while held', () => {
			
			// Pointer is already in HOLDING state

			// To track its prevent default etc..
			const event = createMockEvent( holdableElement );

			// Element holded, move along element (there is no moving threshold for hold)
			pointerHoldable._updatePointer( 20, 20 );
			pointerHoldable._onPointerMove( event );

			expect( pointerHoldable._currentState ).toBe( PointerState.HOLD_DRAGGING );
			expect( event.preventDefault ).toHaveBeenCalled();
			expect( event.stopImmediatePropagation ).toHaveBeenCalled();
			// expect( event.stopPropagation ).toHaveBeenCalled();

		} );

		it( 'should dispatch "HOLDEND" event when hold is released', () => {

			// Simulate holdend
			pointerHoldable._onPointerEnd( createMockEvent( mockTarget ) );

			// Verify if event has been dispatched on our target
			expect( mockTarget.dispatchEvent ).toHaveBeenCalledWith( expect.any( CustomEvent ) );
			const holdEndEvent = jest.mocked( mockTarget.dispatchEvent ).mock.lastCall![ 0 ];

			expect( holdEndEvent.type ).toBe( 'holdend' );
			expect( holdableElement.dataset.holded ).toBe( '0' );
			expect( pointerHoldable._currentState ).toBe( PointerState.IDLE );
			// expect( pointerHoldable._holdedElement ).toBeNull();
		} );
		
	} );

} );