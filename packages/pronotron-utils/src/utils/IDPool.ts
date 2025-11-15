/**
 * IDPool
 * 
 * Manages a pool of unique numeric IDs, providing efficient allocation and release of IDs using an internal bit array.
 * Supports automatic capacity expansion when all IDs are in use.
 * 
 * @example
 * ```typescript
 * const idPool = new IDPool();
 * const availableID: number = idPool.get();
 * idPool.consume( availableID );
 * idPool.release( availableID );
 * ```
 */
export class IDPool
{
	/** @internal */
	private _capacity: number;

	/**
	 * We will store only 0 | 1 to define used or not
	 * @internal
	 */
	private _availableIDs: Uint8Array;

	/**
	 * Initializes the IDPool with a given initial capacity.
	 * 
	 * @param capacityHint Initial number of IDs available; the pool will expand dynamically if needed.
	 */
	constructor( capacityHint: number )
	{
		this._capacity = capacityHint;
		this._availableIDs = new Uint8Array( capacityHint );
	}

	/**
	 * Returns the first available numeric ID from the pool. 
	 * If all IDs are used, the pool automatically expands and returns the next available ID.
	 * 
	 * ***Returned ID must be used with IDPool.consume( ID )***
	 * 
	 * @returns The available ID as a number.
	 */
	get(): number
	{
		// Search for first available ID
		for ( let i = 0; i < this._availableIDs.length; i++ ){
			if ( ! this._availableIDs[ i ] ){
				return i;
			}
		}

		// Hold current capacity, to return after expanding
		const last = this._capacity;

		this._expandCapacity();
		return last;
	}

	/**
	 * Marks a specific ID as used in the pool.
	 * 
	 * @param ID Numeric ID to mark as consumed.
	 */
	consume( ID: number ): void
	{
		this._availableIDs[ ID ] = 1;
	}

	/**
	 * Releases a previously consumed ID, making it available for future allocation.
	 * 
	 * @param ID Numeric ID to release.
	 */
	release( ID: number ): void
	{
		this._availableIDs[ ID ] = 0;
	}

	/**
	 * Doubles the internal storage capacity of the pool when all IDs are in use.
	 * Copies existing ID usage state to the new storage.
	 * 
	 * @internal
	 */
	private _expandCapacity(): void
	{
		const newCapacity = this._capacity * 2;

		// Create new array with increased size
		const newAvailableIDsTable = new Uint8Array( newCapacity );
		newAvailableIDsTable.set( this._availableIDs );

		// Update references and capacity
		this._availableIDs = newAvailableIDsTable;
		this._capacity = newCapacity;
	}
}