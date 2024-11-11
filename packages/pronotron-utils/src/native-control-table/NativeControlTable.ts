type SlotID = string | number;
type SlotPosition = number;

type RequireAtLeastOne<T> = {
	[ K in keyof T ]: Pick<T, K> & Partial<T>;
}[ keyof T ];

type SlotEnumData<EnumType extends Record<string, string | number>> = {
	[ K in EnumType[ keyof EnumType ] ]: number;
};

type NativeTableTypes = Float32Array | Float64Array | Int32Array | Uint8Array | Uint16Array | Uint32Array;

/**
 * NativeControlTable class manages a fixed-size native array (as a control table) with an inferred Enum structure. 
 * It uses a high-frequency access pattern, ideal for animation or real-time applications where 
 * direct memory access is critical for performance.
 * 
 * Removing a node, shifts the last node to the removed node position (if not the last), 
 * so table can be iterated only over _usedSlots number.
 * 
 * @example
 * enum AnimationData {
 * 	ID,
 * 	DURATION
 * };
 * const table = new NativeControlTable( AnimationData, Float32Array, nodeCountHint );
 * 
 * @example
 * // Iterating over the control table,
 * for ( i = 0; i < table.usedSlots; i++ ){
 * 	const slotOffset = i * table.stride;
 * 	const duration = this.table[ slotOffset + AnimationData.DURATION ];
 * 	const id = this.table[ slotOffset + AnimationData.ID ];
 * 	...
 * }
 */
export class NativeControlTable<EnumType extends Record<string | number, string | number>>
{
	public table: NativeTableTypes;

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
	public usedSlots = 0;
	private _maxSlots: number;

	/**
	 * Defines how many elements each node holds.
	 * @example
	 * 4: [ ( +, +, +, + ), ( +, +, +, + ), ... ]
	 */
	public stride: number;

	/**
	 * @param stride Determines the stride size
	 * @param tableType Typed array version
	 * @param nodeCountHint Used to initialize the fixed-size native array, capacity will expand if needed.
	 */
	constructor( stride: number, tableType: { new ( length: number ): NativeTableTypes }, nodeCountHint: number )
	{
		/**
		 * Stride could be calculated with passing Enum but that causes Enum bundled as object in related library
		 * @see https://stackoverflow.com/questions/38034673/determine-the-number-of-enum-elements-typescript
		 */
		//const stride = Object.keys( enumType ).length / 2;

		this._maxSlots = nodeCountHint;
		this.stride = stride;
		this.table = new tableType( this._maxSlots * this.stride );
	}

	addSlot( ID: SlotID, item: SlotEnumData<EnumType> ): void
	{
		if ( this._slotIDToSlotPosition.get( ID ) ){
			console.warn( `ID: '${ ID }' already exist in the table.` );
		}

		const availableSlot = this._findEmptySlot();
		const emptyOffset = availableSlot * this.stride;

		for ( const [ key, value ] of Object.entries<number>( item ) ){
			this.table[ emptyOffset + Number( key ) ] = value;
		}

		this._slotIDToSlotPosition.set( ID, availableSlot );
		this._slotPositionToSlotID.set( availableSlot, ID );
		this.usedSlots += 1;
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

		const isLastSlot = removedSlotPosition === this.usedSlots - 1;

        /**
         * If the slot to be removed is not the last, shift the last slot data to the removed slot position
         */
        if ( ! isLastSlot ){

			const lastSlotPosition = this.usedSlots - 1;
			const lastSlotID = this._slotPositionToSlotID.get( lastSlotPosition )!;
			const lastSlotOffset = lastSlotPosition * this.stride;
			const removedSlotOffset = removedSlotPosition * this.stride;

            /**
             * Shift the last slot's data to the removed slot's position
             */
            for ( let i = 0; i < this.stride; i++ ){
                this.table[ removedSlotOffset + i ] = this.table[ lastSlotOffset + i ];
            }
			this._slotIDToSlotPosition.set( lastSlotID, removedSlotPosition );
			this._slotPositionToSlotID.set( removedSlotPosition, lastSlotID );

			// The last slot position is now null
			this._slotPositionToSlotID.delete( lastSlotPosition );

        } else {
			this._slotPositionToSlotID.delete( removedSlotPosition );
		}

		// Delete the given ID from the map
		this._slotIDToSlotPosition.delete( ID );
		this.usedSlots -= 1;
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
		const offset = position * this.stride;

		for ( const [ key, value ] of Object.entries<number>( item ) ){
			this.table[ offset + Number( key ) ] = value;
		}
	}

	isSlotExist( ID: SlotID ): boolean
	{
		return this._slotIDToSlotPosition.has( ID );
	}

	/**
	 * Returns an available slot.
	 * Since we shift the last slot to the removed slot, 
	 * the empty slot should always equal to _usedSlots.
	 */
	private _findEmptySlot(): number 
	{
		// Expand capacity if there is no available slot
		if ( this.usedSlots === this._maxSlots ){
			this._expandCapacity();
		}

		return this.usedSlots;
	}

	/**
	 * Expands the capacity of table.
	 */
	private _expandCapacity(): void 
	{
		// Double the max slots
		const newMaxSlots = this._maxSlots * 2;

		// Create new table with increased size and copy old table onto it
		const newControlTable = new ( this.table.constructor as { new ( length: number ): NativeTableTypes })( newMaxSlots * this.stride );
		newControlTable.set( this.table );

		// Update references and max slots
		this.table = newControlTable;
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