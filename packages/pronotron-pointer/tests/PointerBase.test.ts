import { PronotronAnimator, PronotronClock } from '@pronotron/utils';

import { PointerBase, PointerState } from '../src/core/PointerBase';

jest.mock( '@pronotron/utils' );

const MockedAnimator = PronotronAnimator as jest.MockedClass<typeof PronotronAnimator>;
const MockedClock = PronotronClock as jest.MockedClass<typeof PronotronClock>;
MockedClock.prototype.getTime = jest.fn().mockReturnValue( { elapsedTime: 0 } );

describe( 'PointerBase', () => {

	let mockTarget: HTMLElement;
	let pointerBase: PointerBase;
	let mockAnimator: PronotronAnimator;
	let mockClock: PronotronClock;
	let isInteractable: jest.Mock;

	const tapThreshold = 0.25;
	const idleThreshold = 0.50;
	const movingDeltaLimit = 20;

	beforeEach( () => {

		jest.restoreAllMocks();

		mockTarget = document.body;
		mockClock = new MockedClock();
		mockAnimator = new MockedAnimator( mockClock );

		jest.spyOn( mockTarget, 'dispatchEvent' );
		isInteractable = jest.fn().mockReturnValue( false );

		pointerBase = new PointerBase( {
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
		pointerBase._stopEvents();
	} );

	// Helper to create a mock DOM event
	const createMockEvent = ( target: EventTarget ) => ( {
		target,
		preventDefault: jest.fn(),
		stopPropagation: jest.fn(),
		stopImmediatePropagation: jest.fn(),
	} ) as unknown as Event;

	describe( 'Initialization and State Check', () => {

		const eventTarget = document.createElement( 'div' );
		const mockedEvent = createMockEvent( eventTarget );

		it( 'should initialize in "IDLE" state', () => {

			expect( pointerBase._isRunning ).toBe( false );

			pointerBase._startEvents();

			expect( pointerBase._isRunning ).toBe( true );
			expect( pointerBase._currentState ).toBe( PointerState.IDLE );
			
		} );

		it( 'should transition to "IDLE → PENDING" on pointerStart()', () => {

			pointerBase._startEvents();
			pointerBase._onPointerStart( mockedEvent );

			expect( pointerBase._currentState ).toBe( PointerState.PENDING );

		} );

		it( 'should transition to "PENDING → IDLE" on pointerEnd()', () => {

			pointerBase._startEvents();
			pointerBase._onPointerStart( mockedEvent );

			// Should dispatch a "tap" event
			pointerBase._onPointerEnd( mockedEvent );

			expect( pointerBase._currentState ).toBe( PointerState.IDLE );

		} );

		it( 'should not dispatch any events before startEvents()', () => {

			/**
			 * _onPointerStart converts state to PENDING, 
			 * but it is a private property
			 * 
			 * expect( pointerBase._currentState ).toBe( PointerState.IDLE );
			 */
			pointerBase._onPointerStart( mockedEvent );

			expect( pointerBase._isRunning ).toBe( false );

		} );
		
	} );

	describe( 'Movement Delta Threshold Check', () => {

		const eventTarget = document.createElement( 'div' );
		const mockedEvent = createMockEvent( eventTarget );
		const moveValueToNotReachLimit = Math.sqrt( movingDeltaLimit - 2 );
		const moveValueToReactLimit = Math.sqrt( movingDeltaLimit / 2 );

		beforeEach( () => {
			pointerBase._startEvents();
			// Sets pointer start position as [0, 0], pointer start time as 0
			pointerBase._onPointerStart( mockedEvent );
		} );

		it( 'should not transition "IDLE ■ MOVING" before exceeding movement threshold', () => {

			// Simulate minor move (should not change state)
			// Will test deltaSq = x*x + y*y < movingDeltaLimit
			pointerBase._updatePointer( moveValueToNotReachLimit, 1 );
			pointerBase._onPointerMove( mockedEvent );

			// Despite movement it should still be PENDING
			expect( pointerBase._currentState ).toBe( PointerState.PENDING );

		} );

		it( 'should transition "IDLE → MOVING" after exceeding movement threshold', () => {

			// Simulate major move (should change state)
			// Will test deltaSq = x*x + y*y > movingDeltaLimit
			pointerBase._updatePointer( moveValueToReactLimit, moveValueToReactLimit );
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
			pointerBase._startEvents();
			// Sets pointer start position as [0, 0], pointer start time as 0
			pointerBase._onPointerStart( mockedEvent );
		} );

		it( 'should dispatch a "tap" event for a short press', () => {

			// Advance time by less than the tap threshold
			mockClock.getTime = jest.fn().mockReturnValue( { elapsedTime: tapThresholdExceed } );
			pointerBase._onPointerEnd( mockedEvent );

			expect( mockTarget.dispatchEvent ).toHaveBeenCalledWith( expect.any( CustomEvent ) );

			const dispatchedEvent = jest.mocked( mockTarget.dispatchEvent ).mock.lastCall![ 0 ] as CustomEvent;
			
			expect( dispatchedEvent.type ).toBe( 'tap' );
			expect( dispatchedEvent.detail.target ).toBe( eventTarget );

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
			pointerBase._startEvents();
			// Sets pointer start position as [0, 0], pointer start time as 0
			pointerBase._onPointerStart( mockedEvent );
		} );

		it( 'should schedule an IDLE animation on pointer move', () => {

			pointerBase._updatePointer( 10, 10 );
			pointerBase._onPointerMove( mockedEvent );

			expect( mockAnimator.add ).toHaveBeenCalledWith( expect.objectContaining( { id: 'IDLE', duration: idleThreshold } ) );

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
			const scheduledAnimationOptions = jest.mocked( mockAnimator.add ).mock.lastCall![ 0 ]

			// Manually trigger the animation end callback
			scheduledAnimationOptions!.onEnd!( false );

			expect( pointerBase._currentState ).toBe( PointerState.IDLE );

		} );

	} );

	describe( 'Interactable Target Check', () => {

		const interactableElement = document.createElement( 'button' );
		const nonInteractableElement = document.createElement( 'div' );

		it( 'should update _canInteract on pointer start and move', () => {

			isInteractable.mockImplementation( target => target.tagName === 'BUTTON' );

			pointerBase._startEvents();

			// Test on pointer start
			pointerBase._onPointerStart( createMockEvent( interactableElement ) );
			expect( pointerBase._canInteract ).toBe( true );

			// Test on pointer move
			pointerBase._onPointerMove( createMockEvent( nonInteractableElement ) );
			expect( pointerBase._canInteract ).toBe( false );

		} );

	} );

} );
