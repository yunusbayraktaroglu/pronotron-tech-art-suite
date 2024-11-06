/**
 * @see https://github.com/mrdoob/three.js/blob/master/src/core/Clock.js
 * 
 * Tracks two type of time
 * 
 * - Global time: Always ticking even screen is unfocused
 * - Active time: Only ticking if screen is focused
 */
export class PronotronClock 
{
	running = false;

	startTime = 0;
	oldTime = 0;
	elapsedTime = 0;

	pauseTime = 0;
	pauseDiff = 0;
	elapsedPausedTime = 0;

	start()
	{
		this.startTime = now();
		this.oldTime = this.startTime;
		this.running = true;
	}

	pause()
	{
		this.pauseTime = now();
	}

	continue()
	{
		this.pauseDiff += ( now() - this.pauseTime ) / 1000;
	}

	/**
	 * Ticks the clock
	 * @returns Delta time
	 */
	tick(): number
	{
		if ( ! this.running ) this.start();
		return this._getDelta();
	}

	private _getDelta()
	{
		let diff = 0;
		const newTime = now();

		diff = ( newTime - this.oldTime ) / 1000;
		
		this.oldTime = newTime;
		
		this.elapsedTime += diff;
		this.elapsedPausedTime = this.elapsedTime - this.pauseDiff;

		return diff;
	}

}

function now() {
	return performance.now();
}