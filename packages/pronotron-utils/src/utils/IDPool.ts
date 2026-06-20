type AllowedIDTable = Uint8Array | Uint16Array | Uint32Array;

/**
 * IDPool
 * 
 * Manages a pool of unique numeric IDs, providing efficient allocation and release of IDs using a pre-allocated stack.
 * Supports automatic capacity expansion when all IDs are in use.
 *  
 * Uses LIFO stack for performance, so use it when you not need human-readability.
 * 
 * @example
 * ```typescript
 * // Initialize with a capacity hint of 1024 IDs, backed by a Uint16Array (up to 65535)
 * const idPool = new IDPool( 1024, Uint16Array );
 * const availableID: number = idPool.get();
 * idPool.release( availableID );
 * ```
 */
export class IDPool
{
	/**
	 * A typed array acting as a fast LIFO stack for recycled IDs
	 * @internal
	 */
	private _freeStack: AllowedIDTable;

	/**
	 * Total capacity of the pool
	 * @internal
	 */
	private _capacity: number;

	/**
	 * Tracks the highest ID that has ever been issued natively
	 * @internal
	 */
	private _freeTop = 0;

	constructor( capacityHint: number, tableType: { new ( length: number ): AllowedIDTable } = Uint16Array )
	{
		this._capacity = capacityHint;
		this._freeTop = capacityHint;

		this._freeStack = new tableType( capacityHint );

		// Pre-fill stack: [0, 1, 2, ..., N-1]
		for ( let i = 0; i < capacityHint; i++ ){
			this._freeStack[ i ] = i;
		}
	}

	/**
	 * Returns an ID from the pool.
	 */
	get(): number
	{
		if ( this._freeTop === 0 ){
			this._expandCapacity();
		}

		return this._freeStack[ --this._freeTop ];
	}

	/**
	 * Pushes given ID back onto the pool.
	 * @param ID 
	 */
	release( ID: number ): void
	{
		// O(1) Push: Add the recycled ID back onto the stack
		this._freeStack[ this._freeTop++ ] = ID;
	}

	/**
	 * Doubles the internal storage capacity of the pool.
	 * @internal
	 */
	private _expandCapacity(): void
	{
		const newCapacity = this._capacity * 2;
		const newStack = new ( this._freeStack.constructor as { new ( length: number ): AllowedIDTable } )( newCapacity );

		newStack.set( this._freeStack );

		// Push the newly added IDs onto the free stack
		for ( let i = this._capacity; i < newCapacity; i++ ) {
			newStack[ this._freeTop++ ] = i;
		}

		this._freeStack = newStack;
		this._capacity = newCapacity;
	}
}