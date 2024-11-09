/**
 * Helps to get a unique Number, by using indices
 * 
 * Another approach may be increasing a static property, 
 * but it might be bigger than 255, 32767, etc. which can't be stored in TypedArray,
 * in a long rally since re-use is not possible.
 */
export class IDPool
{
	private _capacity: number;
	private _availableIDs: Uint8Array; // We will store only 0 | 1 to define used or not

	/**
	 * @param capacityHint Initial capacity. Will be expanded auto if needed.
	 */
	constructor( capacityHint: number )
	{
		this._capacity = capacityHint;
		this._availableIDs = new Uint8Array( capacityHint ).fill( 1 );
	}

	/**
	 * Returns an available ID.
	 */
	getID(): number
	{
		// Search for first available ID
		for ( let i = 0; i < this._availableIDs.length; i++ ){
			if ( this._availableIDs[ i ] ){
				return i;
			}
		}

		// Hold current capacity, to return after expanding
		const last = this._capacity;

		this._expandCapacity();
		return last;
	}

	consumeID( ID: number ): void
	{
		this._availableIDs[ ID ] = 0;
	}

	releaseID( ID: number ): void
	{
		this._availableIDs[ ID ] = 1;
	}

	private _expandCapacity(): void
	{
		const newCapacity = this._capacity * 2;

		// Create new array with increased size
		const newAvailableIDsTable = new Uint8Array( newCapacity ).fill( 1 );
		newAvailableIDsTable.set( this._availableIDs );

		// Update references and capacity
		this._availableIDs = newAvailableIDsTable;
		this._capacity = newCapacity;
	}
}