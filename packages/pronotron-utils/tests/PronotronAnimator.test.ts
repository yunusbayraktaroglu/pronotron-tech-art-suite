import { PronotronAnimator } from "../src/animator/PronotronAnimator";
import { NativeControlTable } from "../src/native-control-table/NativeControlTable";

// NOTE: We create small fake implementations for Clock, IDPool and NativeControlTable
// so tests are deterministic and don't rely on real implementations.

const ANIMATION_STRIDE = 7; // must match the class

// --- Fake Clock ---
class FakeClock 
{
	public elapsedTime = 0;
	public elapsedPausedTime = 0;
	getTime()
	{
		return { 
			elapsedTime: this.elapsedTime, 
			elapsedPausedTime: this.elapsedPausedTime 
		};
	}
}

// --- Fake IDPool ---
class FakeIDPool
{
	private _next = 0;
	public get = jest.fn( () => { return this._next++ } );
	public consume = jest.fn( ( _id: number ) => {} );
	public release = jest.fn( ( _id: number ) => {} );
}

describe( "PronotronAnimator (unit)", () => 
{
	let animator: PronotronAnimator;
	let controlTable: NativeControlTable<any>;

	// Mocks
	let clock: FakeClock;
	let pool: FakeIDPool;

	// create a builder so we can inject the fakes into PronotronAnimator
	function makeAnimator()
	{
		// Because constructor instantiates a NativeControlTable and IDPool internally,
		// we create the animator then overwrite the private fields so our fakes are used.
		const a = new PronotronAnimator( ( clock as any ) as any, 10 );

		// overwrite privates (TS private, but accessible at runtime)
		( a as any )._clock = clock;
		( a as any )._animationInternalIDsPool = pool;
		( a as any )._controlTable = controlTable;
		return a;
	}

	beforeEach( () => {

		clock = new FakeClock();
		pool = new FakeIDPool();
		controlTable = new NativeControlTable( ANIMATION_STRIDE, Float32Array, 20 );
		animator = makeAnimator();

		jest.clearAllMocks();

	} );

	test( "add() registers animation and uses pool.get/consume", () => {

		const onBegin = jest.fn();
		const onRender = jest.fn();
		const onEnd = jest.fn();
		clock.elapsedTime = 0;

		animator.add( {
			id: "anim-1",
			duration: 1,
			delay: 0.5,
			autoPause: false,
			onBegin,
			onRender,
			onEnd,
		} );

		expect( pool.get ).toHaveBeenCalled();
		expect( pool.consume ).toHaveBeenCalled(); // pool.consume should be called with ID allocated
		expect( controlTable.isExist( "anim-1" ) ).toBe( true );
		
		// no lifecycle callbacks called yet
		expect( onBegin ).not.toHaveBeenCalled();
		expect( onRender ).not.toHaveBeenCalled();
		expect( onEnd ).not.toHaveBeenCalled();

	} );

	test( "tick() before start does nothing; at start calls onBegin and onRender", () => {

		const onBegin = jest.fn();
		const onRender = jest.fn();
		const onEnd = jest.fn();

		clock.elapsedTime = 0;

		animator.add( {
			id: "anim-2",
			duration: 2,
			delay: 1,
			autoPause: false,
			onBegin,
			onRender,
			onEnd,
		} );

		// before start (time < startTime)
		clock.elapsedTime = 0.9;
		animator.tick();

		expect( onBegin ).not.toHaveBeenCalled();
		expect( onRender ).not.toHaveBeenCalled();

		// at start time (time >= startTime)
		clock.elapsedTime = 1.0;
		animator.tick();

		expect( onBegin ).toHaveBeenCalledTimes( 1 );
		expect( onRender ).toHaveBeenCalledTimes( 1 );

		// still not finished, no onEnd yet
		expect( onEnd ).not.toHaveBeenCalled();

	} );

	test( "tick() after end calls onEnd(false) and releases pool", () => {

		const onBegin = jest.fn();
		const onRender = jest.fn();
		const onEnd = jest.fn();

		clock.elapsedTime = 0;
		animator.add( {
			id: "anim-3",
			duration: 2, // startTime = 0 + delay(0) ; endTime = 2
			delay: 0,
			autoPause: false,
			onBegin,
			onRender,
			onEnd,
		} );

		// move time past end
		clock.elapsedTime = 3;
		animator.tick();

		// onBegin might be called (pending->rendering) and onEnd called
		expect( onEnd ).toHaveBeenCalledWith( false );
		expect( pool.release ).toHaveBeenCalled(); // pool released

		// the control table entry should be removed
		expect( controlTable.isExist( "anim-3" ) ).toBe( false );

	} );

	test( "remove(id, true) calls onEnd(true) and removes animation", () => {

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
		expect( pool.release ).toHaveBeenCalled();
		expect( controlTable.isExist( "anim-4" ) ).toBe( false );

	} );

	test( "adding duplicate id removes previous animation (forced) before adding new", () => {

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

		// the new animation should exist
		expect( controlTable.isExist( "dup" ) ).toBe( true );

	} );

	test( "autoPause true uses elapsedPausedTime as time source", () => {

		const onRenderPause = jest.fn();
		const onRenderCont = jest.fn();

		// produce different values in elapsedTime vs elapsedPausedTime
		clock.elapsedPausedTime = 12;
		clock.elapsedTime = 43;

		// pausable (autoPause true) - should take elapsedPausedTime (=12)
		animator.add( {
			id: "p1",
			duration: 0,
			delay: 0,
			autoPause: true,
			onBegin: jest.fn(),
			onRender: onRenderPause,
			onEnd: jest.fn(),
		} );

		// continuous (autoPause false) - should take elapsedTime (=43)
		animator.add( {
			id: "c1",
			duration: 0,
			delay: 0,
			autoPause: false,
			onBegin: jest.fn(),
			onRender: onRenderCont,
			onEnd: jest.fn(),
		} );

		// tick: both should be immediately renderable since delay=0
		animator.tick();

		expect( onRenderPause ).toHaveBeenCalled();
		expect( onRenderPause.mock.calls[ 0 ][ 0 ] ).toBe( 12 ); // elapsedPausedTime

		expect( onRenderCont ).toHaveBeenCalled();
		expect( onRenderCont.mock.calls[ 0 ][ 0 ] ).toBe( 43 ); // elapsedTime
		
	} );

} );