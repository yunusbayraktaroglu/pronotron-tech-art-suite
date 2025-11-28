import { PronotronAnimator, PronotronClock, Vector2 } from '@pronotron/utils';

import { PointerBase, PointerState, TapEventDetail } from '../../src/core/interaction/PointerBase';

const MockedAnimator = PronotronAnimator as jest.MockedClass<typeof PronotronAnimator>;
MockedAnimator.prototype.add = jest.fn();

describe( 'PointerBase Test Suite', () => {

	let mockTarget: HTMLElement;
	let pointerBase: PointerBase;
	let mockAnimator: PronotronAnimator;
	let mockClock: PronotronClock;
	let isInteractable: jest.Mock;

	const tapThreshold = 0.25;
	const idleThreshold = 0.50;
	const movingDeltaLimit = 20;
	const startPosition = { x: 300, y: 120 };

	// Helper to create a mock DOM event
	const createMockEvent = ( target: EventTarget ) => ( {
		target,
		preventDefault: jest.fn(),
		stopPropagation: jest.fn(),
		stopImmediatePropagation: jest.fn(),
	} ) as unknown as Event;

	beforeEach( () => {

		jest.restoreAllMocks();

		mockTarget = document.body;
		mockClock = new PronotronClock();
		mockAnimator = new MockedAnimator( mockClock );

		jest.spyOn( mockTarget, 'dispatchEvent' );
		isInteractable = jest.fn().mockReturnValue( false );

		pointerBase = new PointerBase( {
			startPosition,
			target: mockTarget,
			animator: mockAnimator,
			clock: mockClock,
			idleThreshold,
			tapThreshold,
			movingDeltaLimit,
			isInteractable,
		} );

	} );

	afterEach( () => {
		// Reset pointer state
		pointerBase.pointerTarget = null;
		pointerBase._currentState = PointerState.IDLE;
		pointerBase._canInteract = false;
	} );

	describe( 'Initialization and State Check', () => {

		it( 'should initialize in "IDLE" state', () => {

			expect( pointerBase.pointerTarget ).toBe( null );
			expect( pointerBase._currentState ).toBe( PointerState.IDLE );
			expect( pointerBase._canInteract ).toBe( false );
			
		} );

	} );

	describe( 'Movement Delta Threshold Check', () => {

		const eventTarget = document.createElement( 'div' );
		const mockedEvent = createMockEvent( eventTarget );
		const moveValueToNotReachLimit = Math.sqrt( movingDeltaLimit - 2 );
		const moveValueToReachLimit = Math.sqrt( movingDeltaLimit / 2 );

		beforeEach( () => {
			
			// Sets pointer start position as [0, 0], pointer start time as 0
			pointerBase._onPointerStart( mockedEvent );

			// Now PointerState is PENDING
		} );

		it( 'should not transition "PENDING ■ MOVING" before exceeding movement threshold', () => {

			// Add some delta that not discards IDLE
			const currentPosition = pointerBase._pointerEnd;

			// Simulate minor move (should not change state)
			// Will test deltaSq = x*x + y*y < movingDeltaLimit
			pointerBase._updatePointer( currentPosition.x + moveValueToNotReachLimit, currentPosition.y );
			pointerBase._onPointerMove( mockedEvent );

			// Target should be set correctly
			expect( pointerBase.pointerTarget ).toBe( eventTarget );
			// Despite movement it should still be PENDING
			expect( pointerBase._currentState ).toBe( PointerState.PENDING );

		} );

		it( 'should transition "PENDING → MOVING" after exceeding movement threshold', () => {

			// Add some delta that not discards IDLE
			const currentPosition = pointerBase._pointerEnd;

			// Simulate major move (should change state)
			// Will test deltaSq = x*x + y*y > movingDeltaLimit
			pointerBase._updatePointer( currentPosition.x + moveValueToReachLimit, moveValueToReachLimit );
			pointerBase._onPointerMove( mockedEvent );

			expect( pointerBase._currentState ).toBe( PointerState.MOVING );

		} );

	} );

	describe( 'Tap Threshold Check', () => {

		const eventTarget = document.createElement( 'div' );
		const mockedEvent = createMockEvent( eventTarget );
		const tapThresholdExceed = tapThreshold - 0.01;
		const tapThresholdNotExceed = tapThreshold + 0.01;

		beforeEach( () => {
			// Sets pointer start position as [0, 0], pointer start time as 0
			pointerBase._onPointerStart( mockedEvent );
		} );

		it( 'should dispatch a "tap" event for a short press', () => {

			// Advance time by less than the tap threshold
			mockClock.getTime = jest.fn().mockReturnValue( { elapsedTime: tapThresholdExceed } );
			pointerBase._onPointerEnd( mockedEvent );

			expect( mockTarget.dispatchEvent ).toHaveBeenCalledWith( expect.any( CustomEvent ) );

			const dispatchedEvent = jest.mocked( mockTarget.dispatchEvent ).mock.lastCall![ 0 ] as CustomEvent;
			
			const eventDetail = dispatchedEvent.detail as TapEventDetail;

			expect( dispatchedEvent.type ).toBe( 'tap' );
			expect( eventDetail.tapTarget ).toBe( eventTarget );

		} );

		it( 'should NOT dispatch a "tap" event for a long press', () => {

			// Advance time by more than the tap threshold
			mockClock.getTime = jest.fn().mockReturnValue( { elapsedTime: tapThresholdNotExceed } );
			pointerBase._onPointerEnd( mockedEvent );

			expect( mockTarget.dispatchEvent ).not.toHaveBeenCalled();

		} );

	} );

	describe( 'Idle Threshold Check', () => {

		const eventTarget = document.createElement( 'div' );
		const mockedEvent = createMockEvent( eventTarget );

		beforeEach( () => {
			// Sets pointer start position as [0, 0], pointer start time as 0
			pointerBase._onPointerStart( mockedEvent );
		} );

		it( 'should schedule an IDLE animation on pointer move', () => {

			pointerBase._updatePointer( 10, 10 );
			pointerBase._onPointerMove( mockedEvent );

			expect( mockAnimator.add ).toHaveBeenCalledWith( expect.objectContaining( { id: 'IDLE', delay: idleThreshold } ) );

		} );

		it( 'should transition to IDLE when IDLE animation ends', () => {

			expect( pointerBase._currentState ).toBe( PointerState.PENDING );

			pointerBase._updatePointer( 10, 10 );
			pointerBase._onPointerMove( mockedEvent );
			
			expect( pointerBase._currentState ).toBe( PointerState.MOVING );

			/**
			 * IDLE Animation options passed to animator
			 * {
			 * 	id: 'IDLE',
			 * 	duration: number,
			 * 	autoPause: false,
			 * 	onEnd: [Function: onEnd]
			 * }
			 */
			const scheduledAnimationOptions = jest.mocked( mockAnimator.add ).mock.lastCall![ 0 ];

			// Manually trigger the animation end callback
			scheduledAnimationOptions.onBegin!();

			expect( pointerBase._currentState ).toBe( PointerState.IDLE );

		} );

	} );

	describe( 'Interactable Target Check', () => {

		const interactableElement = document.createElement( 'button' );
		const nonInteractableElement = document.createElement( 'div' );

		it( 'should update _canInteract on pointer start and move', () => {

			isInteractable.mockImplementation( target => target.tagName === 'BUTTON' );

			// Test on pointer start
			pointerBase._onPointerStart( createMockEvent( interactableElement ) );
			expect( pointerBase._canInteract ).toBe( true );

			// Test on pointer move
			pointerBase._onPointerMove( createMockEvent( nonInteractableElement ) );
			expect( pointerBase._canInteract ).toBe( false );

		} );

	} );

} );
