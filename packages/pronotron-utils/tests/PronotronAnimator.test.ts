import { describe } from "node:test";
import { PronotronAnimator } from "../src/animator/PronotronAnimator";
import { PronotronClock } from "../src/clock/PronotronClock";

describe( "PronotronAnimator (unit)", () => 
{
	let animator: PronotronAnimator;
	let clock: PronotronClock;
	let now: jest.Mock<number>;

	beforeEach( () => {

		jest.clearAllMocks();
		
		now = jest.fn();
		clock = new PronotronClock( now );
		animator = new PronotronAnimator( clock, 10 );

	} );

	describe( 'Initialization', () => {
		
		it( 'add() registers animation', () => {

			expect( animator.has( 'REGISTER_TEST' ) ).toBe( false );

			const onBegin = jest.fn();
			const onRender = jest.fn();
			const onEnd = jest.fn();

			animator.add( {
				id: "REGISTER_TEST",
				autoPause: false,
				duration: 1,
				delay: 0.5,
				onBegin,
				onRender,
				onEnd,
			} );

			// no lifecycle callbacks called yet
			expect( onBegin ).not.toHaveBeenCalled();
			expect( onRender ).not.toHaveBeenCalled();
			expect( onEnd ).not.toHaveBeenCalled();

			expect( animator.has( 'REGISTER_TEST' ) ).toBe( true );

		} );

		it( 'adding duplicate id removes previous animation (forced) before adding new', () => {

			const onEndFirst = jest.fn();
			const onEndSecond = jest.fn();

			animator.add( {
				id: "DUPLICATE_TEST",
				duration: 1,
				autoPause: false,
				onBegin: jest.fn(),
				onRender: jest.fn(),
				onEnd: onEndFirst,
			} );

			// second add with same client id: should force-remove first
			animator.add( {
				id: "DUPLICATE_TEST",
				duration: 0.5,
				autoPause: false,
				onBegin: jest.fn(),
				onRender: jest.fn(),
				onEnd: onEndSecond,
			} );

			// first onEnd should be called with forced = true
			expect( onEndFirst ).toHaveBeenCalledWith( true );

		} );

		it( "remove(id, true) calls onEnd(true) and removes animation", () => {

			const onBegin = jest.fn();
			const onRender = jest.fn();
			const onEnd = jest.fn();

			animator.add( {
				id: "REMOVE_TEST",
				duration: 1,
				delay: 0,
				autoPause: false,
				onBegin,
				onRender,
				onEnd,
			} );

			animator.remove( "REMOVE_TEST", true );

			// remove(id, true) should execute onEnd(forced: true)
			expect( onEnd ).toHaveBeenCalledWith( true );

			expect( animator.has( 'REMOVE_TEST' ) ).toBe( false );

		} );

		it( 'remove with unvalid id warns', () => {

			// Adding another node with same ref should warn and return false
			const warnSpy = jest.spyOn( console, "warn" ).mockImplementation( () => {} );

			animator.remove( "I_DO_NOT_EXIST", true );

			expect( warnSpy ).toHaveBeenCalled();

			warnSpy.mockRestore();

		} );

	} );

	describe( 'Tick progression', () => {

		it( 'tick() progresses animations and calls lifecycle callbacks appropriately', () => {

			const onBegin = jest.fn();
			const onRender = jest.fn();
			const onEnd = jest.fn();

			// simulate 0 second elapsed
			now.mockReturnValue( 0.0 * 1000 );

			clock.tick();
			animator.tick();

			animator.add( {
				id: "TEST_ANIMATION",
				duration: 2,
				delay: 1,
				autoPause: false,
				onBegin,
				onRender,
				onEnd,
			} );

			// simulate 0.9 second elapsed
			// before start (time < startTime)
			now.mockReturnValue( 0.9 * 1000 );

			clock.tick();
			animator.tick();

			expect( onBegin ).not.toHaveBeenCalled();
			expect( onRender ).not.toHaveBeenCalled();

			// simulate 1 second elapsed
			// at start time (time >= startTime)
			now.mockReturnValue( 1.0 * 1000 );

			clock.tick();
			animator.tick();

			expect( onBegin ).toHaveBeenCalledTimes( 1 );
			expect( onRender ).toHaveBeenCalledTimes( 1 );

			// still not finished, no onEnd yet
			expect( onEnd ).not.toHaveBeenCalled();

			// simulate 2 second elapsed
			// at start time (time > endTime)
			now.mockReturnValue( 3.01 * 1000 );

			clock.tick();
			animator.tick();

			expect( onEnd ).toHaveBeenCalledTimes( 1 );

		} );

	} );

	/**
	 * Parametrized suite that verifies exact callback fire counts for N concurrent animations.
	 * 
	 * Tests the NativeControlTable swap-remove integrity by ensuring an early-terminating 
	 * animation correctly exits without causing ghost reads or skipping newly swapped slots.
	 */
	describe( 'Callback fire counts across N concurrent animations (Swap-Remove Integrity)', () => {

		const testCases = [
			[ 2,  'start', 0 ],
			[ 2,  'end',   1 ],
			[ 3,  'start', 0 ],
			[ 3,  'mid',   1 ],
			[ 3,  'end',   2 ],
			[ 5,  'start', 0 ],
			[ 5,  'mid',   2 ],
			[ 5,  'end',   4 ],
			[ 10, 'start', 0 ],
			[ 10, 'mid',   4 ],
			[ 10, 'end',   9 ],
		];

		it.each( testCases )( 'N=%i, finishing from %s (index %i)', ( N, position, shortIndex ) => {

			// Single mock functions that capture the index of the caller
			const mockBegin  = jest.fn();
			const mockRender = jest.fn();
			const mockEnd    = jest.fn();

			// Setup baseline time
			now.mockReturnValue( 0 );
			clock.tick();
			animator.tick(); 

			// Populate NativeControlTable
			for ( let i = 0; i < N; i++ ){

				const isShort = i === shortIndex;
				
				animator.add( {
					id: isShort ? 'short' : `long-${ i }`,
					autoPause: false,
					duration: isShort ? 1 : 10,
					onBegin: () => mockBegin( i ),
					onRender: () => mockRender( i ),
					onEnd: () => mockEnd( i ),
				} );

			}

			// Tick 1: 'short' ends (duration 1s), triggering the swap-remove
			now.mockReturnValue( 1.1 * 1000 );
			clock.tick();
			animator.tick();

			// Tick 2: verifies 'long' animations survive the swap and continue ticking
			now.mockReturnValue( 2.0 * 1000 );
			clock.tick();
			animator.tick();

			// --- ASSERTIONS ---

			// Every single animation should begin exactly once. No duplicates.
			expect( mockBegin ).toHaveBeenCalledTimes( N );

			// Only the 'short' animation ends, and it ends exactly once.
			expect( mockEnd ).toHaveBeenCalledTimes( 1 );
			expect( mockEnd ).toHaveBeenCalledWith( shortIndex );

			// Render count math:
			// - The 1 'short' animation renders exactly once (in Tick 1).
			// - The N-1 'long' animations render twice (in Tick 1 and Tick 2).
			// - Total expected renders: 1 + (N - 1) * 2 = 2N - 1
			expect( mockRender ).toHaveBeenCalledTimes( 2 * N - 1 );

			// Ensure the short animation wasn't accidentally kept alive and rendered in Tick 2
			expect( mockRender ).not.toHaveBeenLastCalledWith( shortIndex );

		} );

	} );

	describe( 'Non-renderable animations (delay + onBegin only, no onRender/duration)', () => {
 
		it( 'fires onBegin once and onEnd(false) once, without ever touching onRender', () => {
 
			const onBegin = jest.fn();
			const onEnd = jest.fn();
 
			now.mockReturnValue( 0 );
			clock.tick();
			animator.tick();
 
			// No `onRender`, no `duration` - this is the NonRenderableAnimation shape
			// (e.g. a pure "wait then fire a callback" chain step).
			animator.add( {
				id: "non-renderable-1",
				delay: 1,
				autoPause: false,
				onBegin,
				onEnd,
			} );
 
			// reaches startTime (1s): onBegin fires; RENDERABLE is 0, so the table-driven
			// tick() loop must skip the onRender call entirely instead of throwing on
			// a missing function.
			now.mockReturnValue( 1.0 * 1000 );
			clock.tick();
			animator.tick();
 
			expect( onBegin ).toHaveBeenCalledTimes( 1 );
			expect( onEnd ).not.toHaveBeenCalled();
			expect( animator.has( "non-renderable-1" ) ).toBe( true );
 
			// duration defaults to 0, so endTime === startTime; the next tick once
			// time has moved past that instant finishes it naturally.
			now.mockReturnValue( 1.1 * 1000 );
			clock.tick();
			animator.tick();
 
			expect( onEnd ).toHaveBeenCalledTimes( 1 );
			expect( onEnd ).toHaveBeenCalledWith( false );
			expect( animator.has( "non-renderable-1" ) ).toBe( false );
 
		} );
 
	} );

	describe( "fastForward()", () => {

		it( 'is a no-op for an ID that does not exist (does not throw, no warning)', () => {
 
			const warnSpy = jest.spyOn( console, "warn" ).mockImplementation( () => {} );
 
			expect( () => animator.fastForward( "ghost", 5 ) ).not.toThrow();
			expect( animator.has( "ghost" ) ).toBe( false );
 
			// Unlike remove(), an unknown ID is expected (e.g. a chain step that
			// already finished naturally), so this should stay silent.
			expect( warnSpy ).not.toHaveBeenCalled();
 
			warnSpy.mockRestore();
 
		} );

		it( 'produces a correctly advanced timeline when only partially fast-forwarded', () => {
 
			const onBegin = jest.fn();
			const onRender = jest.fn();
			const onEnd = jest.fn();
 
			now.mockReturnValue( 0 );
			clock.tick();
			animator.tick();
 
			animator.add( {
				id: "TEST_FAST_FORWARD",
				duration: 4,
				delay: 0, // window: [0, 4]
				autoPause: false,
				onBegin,
				onRender,
				onEnd,
			} );
 
			// jump 1s into the animation without advancing the global clock
			animator.fastForward( "TEST_FAST_FORWARD", 1 );
 
			clock.tick();
			animator.tick();
 
			// currentTime(0) - startTime(-1) = 1s elapsed of a 4s duration
			expect( onRender ).toHaveBeenCalledWith( 0, -1, 4 );
			expect( onEnd ).not.toHaveBeenCalled();
			expect( animator.has( "TEST_FAST_FORWARD" ) ).toBe( true );
 
		} );
		
	} );

	describe( 'Internal capacity expansion', () => {
 
		it( 'keeps working correctly once more animations are added than the initial capacity hint', () => {
 
			// Capacity hint of 2: adding a 3rd concurrent animation forces both the
			// internal IDPool and NativeControlTable to expand past their starting size.
			const smallAnimator = new PronotronAnimator( clock, 2 );
 
			const onBegin = jest.fn();
			const onRender = jest.fn();
 
			now.mockReturnValue( 0 );
			clock.tick();
 
			smallAnimator.add( { id: "cap-1", duration: 1, autoPause: false, onBegin: jest.fn(), onRender: jest.fn(), onEnd: jest.fn() } );
			smallAnimator.add( { id: "cap-2", duration: 1, autoPause: false, onBegin: jest.fn(), onRender: jest.fn(), onEnd: jest.fn() } );
 
			// this 3rd add exceeds the capacity hint of 2 and triggers expansion
			smallAnimator.add( { id: "cap-3", duration: 1, autoPause: false, onBegin, onRender, onEnd: jest.fn() } );
 
			expect( smallAnimator.has( "cap-3" ) ).toBe( true );
 
			smallAnimator.tick();
 
			// the expanded slot must behave identically to any other slot
			expect( onBegin ).toHaveBeenCalledTimes( 1 );
			expect( onRender ).toHaveBeenCalledTimes( 1 );
 
		} );
 
	} );

} );