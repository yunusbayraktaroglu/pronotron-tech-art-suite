import { PronotronAnimator, PronotronClock, Vector2 } from '@pronotron/utils';

jest.mock( '@pronotron/utils', () => {
	// Keep Vector2 as it is
	const actual = jest.requireActual( '@pronotron/utils' );
	const auto = jest.createMockFromModule<typeof actual>( '@pronotron/utils' );
	auto.PronotronClock.prototype.getTime = jest.fn().mockReturnValue( { elapsedTime: 0 } );
	return {
		...actual,
		PronotronAnimator: auto.PronotronAnimator,
		PronotronClock: auto.PronotronClock,
	};
} );

import { PointerState } from '../../src/core/interaction/PointerBase';
import { PointerHoldable, type HoldEventDetail, type ReleaseEventDetail } from '../../src/core/interaction/PointerHoldable';

describe( 'PointerHoldable Test Suite', () => {

	let mockTarget: HTMLElement;
	let mockAnimator: PronotronAnimator;
	let mockClock: PronotronClock;
	let pointerHoldable: PointerHoldable;
	
	// We will test isInteractable with PointerBase tests
	const isInteractable: jest.Mock = jest.fn().mockImplementation( ( target: HTMLElement ) => false );

	const isHoldable: jest.Mock = jest.fn().mockImplementation( ( target: HTMLElement ) => target.tagName === 'BUTTON' );
	const holdableElement = document.createElement( 'button' );
	const nonHoldableElement = document.createElement( 'div' );

	const idleThreshold = 0.5;
	const tapThreshold = 0.25;
	const movingDeltaLimit = 20;
	const holdThreshold = 0.5;

	// Utility to create a synthetic DOM event with mocked propagation methods
	const createMockEvent = ( target: EventTarget ) => ( {
		target,
		preventDefault: jest.fn(),
		stopPropagation: jest.fn(),
		stopImmediatePropagation: jest.fn(),
	} ) as unknown as Event;

	beforeAll( () => {

		mockTarget = document.body;
		mockClock = new PronotronClock();
		mockAnimator = new PronotronAnimator( mockClock );
		
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

	describe( 'Initialization', () => {

		it( 'should initialize with correct default state values', () => {

			expect( pointerHoldable._canHold ).toBe( false );
			expect( pointerHoldable._currentState ).toBe( PointerState.IDLE );

		} );

		it( 'should ignore on non-holdable targets', () => {

			pointerHoldable._onPointerStart( createMockEvent( nonHoldableElement ) );
			expect( pointerHoldable._canHold ).toBe( false );

			pointerHoldable._onPointerStart( createMockEvent( holdableElement ) );
			expect( pointerHoldable._canHold ).toBe( true );

			pointerHoldable._onPointerEnd( createMockEvent( holdableElement ) );
			expect( pointerHoldable._canHold ).toBe( false );

		} );

	} );

	describe( 'Holdable Lifecycle', () => {

		beforeAll( () => {

			jest.restoreAllMocks();
			jest.spyOn( mockTarget, 'dispatchEvent' );

			// Start pointer on a holdable, sets pointer start position as [0, 0], pointer start time as 0
			pointerHoldable._onPointerStart( createMockEvent( holdableElement ) );

			// Now PointerState is PENDING

		} );

		it( 'should schedule HOLD animation when target is holdable', () => {
			
			expect( pointerHoldable._currentState ).toBe( PointerState.PENDING );
			expect( mockAnimator.add ).toHaveBeenCalledWith( expect.objectContaining( { id: 'HOLD', delay: holdThreshold } ) );
			expect( pointerHoldable._canHold ).toBe( true );

		} );

		it( 'should dispatch "HOLD" event when holdThreshold is exceeded', () => {

			pointerHoldable._onPointerStart( createMockEvent( holdableElement ) );

			// Advance time by more than the hold threshold
			mockClock.getTime = jest.fn().mockReturnValue( { elapsedTime: holdThreshold + 0.01 } );

			/**
			 * HOLD Animation options passed to animator
			 * {
			 * 	id: 'HOLD',
			 * 	delay: number,
			 * 	autoPause: false,
			 * 	onBegin: [Function: onBegin]
			 * }
			 */
			const scheduledAnimationOptions = jest.mocked( mockAnimator.add ).mock.lastCall![ 0 ];

			// Manually invoke the onBegin callback to simulate animation
			scheduledAnimationOptions.onBegin!();

			// The "hold" event should be dispatched
			expect( mockTarget.dispatchEvent ).toHaveBeenCalledWith( expect.any( CustomEvent ) );

			const dispatchedEvent = jest.mocked( mockTarget.dispatchEvent ).mock.lastCall![ 0 ] as CustomEvent;
			const eventDetail = dispatchedEvent.detail as HoldEventDetail;

			expect( pointerHoldable._currentState ).toBe( PointerState.HOLDING );
			expect( dispatchedEvent.type ).toBe( 'hold' );
			
			expect( eventDetail.holdTarget ).toBe( holdableElement );
			expect( eventDetail.position ).toEqual( { x: 0, y: 0 } );
			
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
			// expect( event.stopPropagation ).toHaveBeenCalled();
			// expect( event.stopImmediatePropagation ).toHaveBeenCalled();

		} );

		it( 'should dispatch "HOLDEND" event when hold is released', () => {

			// Simulate holdend
			pointerHoldable._onPointerEnd( createMockEvent( mockTarget ) );

			// Verify if event has been dispatched on our target
			expect( mockTarget.dispatchEvent ).toHaveBeenCalledWith( expect.any( CustomEvent ) );

			const holdEndEvent = jest.mocked( mockTarget.dispatchEvent ).mock.lastCall![ 0 ] as CustomEvent;
			const eventDetail = holdEndEvent.detail as ReleaseEventDetail;

			expect( pointerHoldable._currentState ).toBe( PointerState.IDLE );
			expect( holdEndEvent.type ).toBe( 'holdend' );

			expect( eventDetail.holdTarget ).toBe( holdableElement );
			expect( eventDetail.releaseTarget ).toBe( mockTarget );
			expect( eventDetail.position ).toEqual( { x: 20, y: 20 } );

		} );
		
	} );

} );