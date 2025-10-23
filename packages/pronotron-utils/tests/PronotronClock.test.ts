// PronotronClock.test.ts
import { PronotronClock } from "../src/clock/PronotronClock"; // adjust path if needed

describe( "PronotronClock", () => {

	let originalNow: typeof performance.now;

	beforeAll( () => {
		// Save original
		originalNow = performance.now.bind( performance );
	} );

	afterAll( () => {
		// Restore original
		( performance.now as jest.MockedFunction<typeof performance.now> ) = originalNow as any;
	} );

	test( "tick() starts clock and returns correct delta and getTime() reflects elapsed", () => {

		// Sequence of timestamps (ms) that will be returned by performance.now() calls.
		// tick() will call now() inside _start() then inside _getDelta().
		const sequence = [ 1000, 1016 ]; // start time, newTime
		( performance.now as any ) = jest.fn( () => sequence.shift()! );

		const clock = new PronotronClock();
		const delta = clock.tick(); // should use 1000 then 1016

		expect( delta ).toBeCloseTo( ( 1016 - 1000 ) / 1000, 8 ); // 0.016

		const { elapsedTime, elapsedPausedTime } = clock.getTime();
		
		expect( elapsedTime ).toBeCloseTo( delta, 8 );
		expect( elapsedPausedTime ).toBeCloseTo( delta, 8 );

	} );

	test( "multiple ticks accumulate globalElapsed", () => {
		// We'll provide a sequence of now() values for each now() call.
		// First tick: _start()->1000, _getDelta()->1100 (delta 0.1)
		// Second tick: _getDelta()->1600 (delta 0.5)
		const seq = [ 1000, 1100, 1600 ];
		( performance.now as any ) = jest.fn( () => seq.shift()! );

		const clock = new PronotronClock();
		const d1 = clock.tick(); // 0.1
		const d2 = clock.tick(); // 0.5
		expect( d1 ).toBeCloseTo( 0.1, 8 );
		expect( d2 ).toBeCloseTo( 0.5, 8 );

		const { elapsedTime, elapsedPausedTime } = clock.getTime();

		expect( elapsedTime ).toBeCloseTo( d1 + d2, 8 );
		expect( elapsedPausedTime ).toBeCloseTo( d1 + d2, 8 );
	} );

	test( "pause() and resume() affect active (paused) time but not global time", () => {
		// Timestamps sequence:
		// tick() -> start 1000, getDelta 1100  => delta 0.1
		// pause() at 1200 (pauseStartTime)
		// resume() at 2200 (adds 1.0s to totalPausedDuration)
		// tick() at 2300 -> diff = (2300 - lastTickTime(1100)) /1000 = 1.2
		// globalElapsed = 0.1 + 1.2 = 1.3
		// activeElapsed = globalElapsed - totalPausedDuration = 1.3 - 1.0 = 0.3

		const seq = [ 1000, 1100, 1200, 2200, 2300 ];
		( performance.now as any ) = jest.fn( () => seq.shift()! );

		const clock = new PronotronClock();
		const d1 = clock.tick(); // uses 1000 -> 1100
		expect( d1 ).toBeCloseTo( 0.1, 8 );

		// Pause at 1200
		clock.pause();

		// Resume at 2200
		clock.resume();

		// Next tick at 2300
		const d2 = clock.tick();
		expect( d2 ).toBeCloseTo( ( 2300 - 1100 ) / 1000, 8 ); // 1.2

		const { elapsedTime, elapsedPausedTime } = clock.getTime();

		expect( elapsedTime ).toBeCloseTo( 0.1 + 1.2, 8 ); // 1.3
		expect( elapsedPausedTime ).toBeCloseTo( ( 0.1 + 1.2 ) - 1.0, 8 ); // 0.3
	} );
} );
