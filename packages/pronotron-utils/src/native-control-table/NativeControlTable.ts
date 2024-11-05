type SlotID = string | number;
type SlotPosition = number;

type RequireAtLeastOne<T> = {
	[ K in keyof T ]: Pick<T, K> & Partial<T>;
}[ keyof T ];

type SlotEnumData<EnumType extends Record<string, string | number>> = {
	[ K in EnumType[ keyof EnumType ] ]: number;
};

/**
 * NativeControlTable class manages a fixed-size native array (as a control table) with an inferred Enum structure. 
 * It uses a high-frequency access pattern, ideal for animation or real-time applications where 
 * direct memory access is critical for performance.
 * 
 * @example
 * // Iterating over the control table
 * for ( i = 0; i < this._usedSlots; i++ ){
 * 	const slotOffset = i * this._stride;
 * 	const item0 = this._controlTable[ slotOffset ];
 * 	const item1 = this._controlTable[ slotOffset + 1 ];
 * 	...
 * }
 */
export class NativeControlTable<EnumType extends Record<string | number, string | number>>
{
	public _controlTable: Float32Array | Float64Array | Uint16Array | Uint32Array;

	/**
	 * Added element will pick the first available index in the array.
	 * [ 0, 0, 0, 0, 0, 0, 0, (1), 1, 1, 1, ...]
	 * When an element is removed, if it is not in the last slot, we are shifting last slot to removed position.
	 */
	private _availableSlotPositionsTable: Uint8Array;

	/**
	 * Keeps track of slot IDs and their current slot positions to enable slot removal.
	 * Slot positions may change during removals due to shifting.
	 */
	private _slotIDToSlotPosition = new Map<SlotID, SlotPosition>();
	private _slotPositionToSlotID = new Map<SlotPosition, SlotID>();

	/**
	 * The control table is created with a fixed size.
	 * This property tracks how many slots are currently used.
	 */
	_usedSlots = 0;
	_maxSlots: number;

	/**
	 * Defines how many elements each node holds.
	 * @example
	 * 4: [ ( +, +, +, + ), ( +, +, +, + ), ... ]
	 */
	_stride: number;

	/**
	 * @param enumType Determines the stride size and infers the type
	 * @param nodeCountHint Used to initialize the fixed-size native array; capacity will expand if needed.
	 */
	constructor( enumType: EnumType, nodeCountHint: number )
	{
		/**
		 * @see https://stackoverflow.com/questions/38034673/determine-the-number-of-enum-elements-typescript
		 */
		const stride = Object.keys( enumType ).length / 2;

		this._maxSlots = nodeCountHint;
		this._stride = stride;
		this._controlTable = new Float32Array( this._maxSlots * this._stride );
		this._availableSlotPositionsTable = new Uint8Array( this._maxSlots ).fill( 1 );
	}

	addSlot( ID: SlotID, item: SlotEnumData<EnumType> ): void
	{
		if ( this._slotIDToSlotPosition.get( ID ) ){
			console.warn( `ID: '${ ID }' already exist in the table.` );
		}

		const availableSlot = this._findEmptySlot();
		const emptyOffset = availableSlot * this._stride;

		for ( const [ key, value ] of Object.entries<number>( item ) ){
			this._controlTable[ emptyOffset + Number( key ) ] = value;
		}

		this._slotIDToSlotPosition.set( ID, availableSlot );
		this._slotPositionToSlotID.set( availableSlot, ID );
		this._availableSlotPositionsTable[ availableSlot ] = 0;
		this._usedSlots += 1;
	}

	/**
	 * Does not actually remove data; instead, it shifts the last slot's data to the removed slot
	 * and updates available slots and used slots, avoiding a bulk sort operation.
	 */
	removeSlot( ID: SlotID ): void 
	{
		const removedSlotPosition = this._slotIDToSlotPosition.get( ID );

		// Check for undefined; a boolean check is incorrect since ID might be 0
		if ( removedSlotPosition === undefined ){
			console.warn( `ID: '${ ID }' is not found in the table.` );
			return;
		}

		const isLastSlot = removedSlotPosition === this._usedSlots - 1;

        /**
         * If the slot to be removed is not the last, shift the last slot data to the removed slot position
         */
        if ( ! isLastSlot ){

			const lastSlotPosition = this._usedSlots - 1;
			const lastSlotID = this._slotPositionToSlotID.get( lastSlotPosition )!;
			const lastSlotOffset = lastSlotPosition * this._stride;
			const removedSlotOffset = removedSlotPosition * this._stride;

            /**
             * Shift the last slot's data to the removed slot's position
             */
            for ( let i = 0; i < this._stride; i++ ){
                this._controlTable[ removedSlotOffset + i ] = this._controlTable[ lastSlotOffset + i ];
            }
			this._slotIDToSlotPosition.set( lastSlotID, removedSlotPosition );
			this._slotPositionToSlotID.set( removedSlotPosition, lastSlotID );

			// The last slot position is now null
			this._slotPositionToSlotID.delete( lastSlotPosition );
			this._availableSlotPositionsTable[ lastSlotPosition ] = 1;

        } else {
			this._slotPositionToSlotID.delete( removedSlotPosition );
			this._availableSlotPositionsTable[ removedSlotPosition ] = 1;
		}

		// Mark the removed slot as available and delete the ID from the map
		this._slotIDToSlotPosition.delete( ID );
		this._usedSlots -= 1;
	}

	modifySlotByID( ID: SlotID, item: RequireAtLeastOne<SlotEnumData<EnumType>> ): void
	{
		const slotPosition = this._slotIDToSlotPosition.get( ID );

		// Check for undefined; a boolean check is incorrect since ID might be 0
		if ( slotPosition === undefined ){
			console.warn( `ID: '${ ID }' is not found in the table.` );
			return;
		}

		this.modifySlotByPosition( slotPosition, item );
	}

	/**
	 * While iterating over table, we already know the index of the node, 
	 * which may need to be modified depends on some condition.
	 */
	modifySlotByPosition( position: number, item: RequireAtLeastOne<SlotEnumData<EnumType>> ): void
	{
		const offset = position * this._stride;

		for ( const [ key, value ] of Object.entries<number>( item ) ){
			this._controlTable[ offset + Number( key ) ] = value;
		}
	}

	isSlotExist( ID: SlotID ): boolean
	{
		return this._slotIDToSlotPosition.has( ID );
	}

	/**
	 * Returns an available slot.
	 * Since we shift the last slot to the removed slot, 
	 * the empty slot should always equal this._usedSlots.
	 */
	private _findEmptySlot(): number 
	{
		// Expand capacity if there is no available slot
		if ( this._usedSlots === this._maxSlots ){
			this._expandCapacity();
		}

		return this._usedSlots;
	}

	/**
	 * Expands the capacity of _controlTable and _availableSlotsTable.
	 */
	private _expandCapacity(): void 
	{
		// Double the max slots
		const newMaxSlots = this._maxSlots + 5;

		// Create new arrays with increased size
		const newControlTable = new Float32Array( newMaxSlots * this._stride );
		const newAvailableSlotPositionsTable = new Uint8Array( newMaxSlots ).fill( 1 );

		// Copy data to new arrays
		newControlTable.set( this._controlTable );
		newAvailableSlotPositionsTable.set( this._availableSlotPositionsTable );

		// Update references and max slots
		this._controlTable = newControlTable;
		this._availableSlotPositionsTable = newAvailableSlotPositionsTable;
		this._maxSlots = newMaxSlots;
	}
}





// enum AnimationData {
// 	ID,
// 	DURATION,
// 	STARTTIME,
// 	ENDTIME,
// 	RENDERABLE,
// 	TIMESTYLE,
// };

// const controlTable = new NativeControlTable( AnimationData, 10 );
// controlTable.addSlot( "animation_5", {
// 	[AnimationData.ID]: 5,
// 	[AnimationData.DURATION]: 1,
// 	[AnimationData.STARTTIME]: 10,
// 	[AnimationData.ENDTIME]: 10,
// 	[AnimationData.RENDERABLE]: 10,
// 	[AnimationData.TIMESTYLE]: 10,
// });