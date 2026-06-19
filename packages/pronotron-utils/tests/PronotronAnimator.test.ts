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
		
		it( 'add() registers animation' , () => {

			const onBegin = jest.fn();
			const onRender = jest.fn();
			const onEnd = jest.fn();

			animator.add( {
				id: "anim-1",
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

		} );

		it( 'adding duplicate id removes previous animation (forced) before adding new', () => {

			const onEndFirst = jest.fn();
			const onEndSecond = jest.fn();

			animator.add( {
				id: "dup",
				duration: 1,
				autoPause: false,
				onBegin: jest.fn(),
				onRender: jest.fn(),
				onEnd: onEndFirst,
			} );

			// second add with same client id: should force-remove first
			animator.add( {
				id: "dup",
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
				id: "anim-4",
				duration: 1,
				delay: 0,
				autoPause: false,
				onBegin,
				onRender,
				onEnd,
			} );

			animator.remove( "anim-4", true );

			// remove(id, true) should execute onEnd(forced: true)
			expect( onEnd ).toHaveBeenCalledWith( true );

		} );

		it( 'remove with unvalid id warns', () => {

			// Adding another node with same ref should warn and return false
			const warnSpy = jest.spyOn( console, "warn" ).mockImplementation( () => {} );

			animator.remove( "i-do-not-exist", true );

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
				id: "anim-2",
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
					onBegin:  () => mockBegin( i ),
					onRender: () => mockRender( i ),
					onEnd:    () => mockEnd( i ),
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

} );