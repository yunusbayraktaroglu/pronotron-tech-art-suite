/**
 * PronotronClock
 *
 * A dual-domain clock that tracks both:
 *
 * - **Global time** — always progresses (unaffected by tab focus)
 * - **Active time** — pauses when the screen/tab is unfocused
 *
 * This allows animations or logic to selectively follow either time domain.
 * 
 * @example
 * ```ts
 * const clock = new PronotronClock();
 * const handleVisibilityChange = () => {
 * 	if ( document.hidden ){
 * 		clock.pause();
 * 	} else {
 * 		clock.resume();
 * 	}
 * };
 * document.addEventListener( 'visibilitychange', handleVisibilityChange );
 * 
 * // In your main loop:
 * function frame()
 * {
 * 	const delta = clock.tick();
 * 	const { elapsedTime, elapsedPausedTime } = clock.getTime();
 * 	// ...rest
 * }
 * frame();
 * ```
 */
export class PronotronClock 
{
	private _now: () => number;

	/**
	 * Indicates whether the clock has started ticking.
	 * @internal
	 */
	private _running = false;

	/**
	 * Timestamp when the clock first started (ms)
	 * @internal
	 */
	private _startTime = 0;

	/**
	 * Timestamp of the last tick (ms)
	 * @internal
	 */
	private _lastTickTime = 0;

	/**
	 * Total elapsed real-world time (s) — unaffected by pause state
	 * @internal
	 */
	private _globalElapsed = 0;

	/**
	 * Timestamp when pause() was last triggered (ms)
	 * @internal
	 */
	private _pauseStartTime = 0;

	/**
	 * Accumulated time spent paused (s)
	 * @internal
	 */
	private _totalPausedDuration = 0;

	/**
	 * Elapsed time excluding paused intervals (s)
	 * @internal
	 */
	private _activeElapsed = 0;

	/**
	 * Create a PronotronClock instance.
	 *
	 * @param now - A callback that returns the current time as a number. Typically this is performance.now()
	 */
	constructor( now?: () => number )
	{
		this._now = now || ( () => performance.now() );
	}

	/**
	 * Advances the clock by one frame and computes the delta time.
	 * Call this once per render frame
	 * 
	 * @returns The time elapsed since the previous tick (delta time), in seconds.
	 */
	tick(): number
	{
		if ( ! this._running ) this._start();
		return this._getDelta();
	}

	/**
	 * Pauses the "active" time domain without affecting global time.
	 * Call when the window or app loses focus.
	 */
	pause(): void
	{
		this._pauseStartTime = this._now();
	}

	/**
	 * Resumes the "active" time domain.
	 * Adjusts for time spent paused so that active time remains continuous.
	 */
	resume(): void
	{
		this._totalPausedDuration += ( this._now() - this._pauseStartTime ) / 1000;
	}

	/**
	 * Returns the current time states for both global and active timelines.
	 */
	getTime(): { elapsedTime: number; elapsedPausedTime: number }
	{
		return { 
			elapsedTime: this._globalElapsed, 
			elapsedPausedTime: this._activeElapsed 
		};
	}

	/**
	 * Initializes the clock on the first tick.
	 * @internal
	 */
	private _start(): void
	{
		this._startTime = this._now();
		this._lastTickTime = this._startTime;
		this._running = true;
	}

	/**
	 * Computes delta time between frames and updates elapsed counters.
	 * @internal
	 */
	private _getDelta(): number
	{
		const newTime = this._now();
		const diff = ( newTime - this._lastTickTime ) / 1000;
		
		this._lastTickTime = newTime;
		
		this._globalElapsed += diff;
		this._activeElapsed = this._globalElapsed - this._totalPausedDuration;

		return diff;
	}

}