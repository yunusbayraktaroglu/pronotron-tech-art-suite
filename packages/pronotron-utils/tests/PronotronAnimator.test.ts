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

} );