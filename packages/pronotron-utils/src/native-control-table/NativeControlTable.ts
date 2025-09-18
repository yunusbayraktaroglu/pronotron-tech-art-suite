import type { RequireAtLeastOne, EnumValueMap } from "../utils/Types";

type NativeTableTypes = Float32Array | Float64Array | Int32Array | Uint8Array | Uint16Array | Uint32Array;
type SlotID = string | number;
type SlotPosition = number;

/**
 * NativeControlTable class manages a fixed-size native array (as a control table) with an inferred numeric Enum structure. 
 * It uses a high-frequency access pattern, ideal for animation or real-time applications where 
 * direct memory access is critical for performance.
 * 
 * @example
 * ```typescript
 * enum AnimationData {
 * 	ID,
 * 	DURATION,
 * 	...
 * };
 * // Any typed array can be used
 * const table: NativeControlTable<AnimationData> = new NativeControlTable( 2, Uint16Array, nodeCountHint );
 * ```
 * @example
 * ```typescript
 * // Iterating over the control table,
 * for ( i = 0; i < table.usedSlots; i++ ){
 * 	const slotOffset = i * table.stride;
 * 	const duration = this.table[ slotOffset + AnimationData.DURATION ];
 * 	const id = this.table[ slotOffset + AnimationData.ID ];
 * 	...
 * }
 * ```
 */
export class NativeControlTable<EnumType extends number>
{
	public table: NativeTableTypes;

	/**
	 * Keeps track of slot IDs and their current slot positions to enable slot removal.
	 * Slot positions may change during removals due to shifting.
	 * @internal
	 */
	private _slotIDToSlotPosition = new Map<SlotID, SlotPosition>();

	/**
	 * Helps to shifting data instead of removing, see above
	 * @internal
	 */
	private _slotPositionToSlotID = new Map<SlotPosition, SlotID>();

	/**
	 * The control table is created with a fixed size.
	 * This property tracks how many slots are currently used.
	 */
	public usedSlots = 0;

	/** @internal */
	private _maxSlots: number;

	/**
	 * Defines how many elements each node holds.
	 * @example
	 * 4: [ ( +, +, +, + ), ( +, +, +, + ), ... ]
	 */
	public stride: number;

	/**
	 * Initializes a fixed-size native control table with a specified stride and underlying typed array.
	 * 
	 * @param stride Determines the stride size
	 * @param tableType Typed array version
	 * @param nodeCountHint Used to initialize the fixed-size native array, capacity will expand if needed.
	 */
	constructor( stride: number, tableType: { new ( length: number ): NativeTableTypes }, nodeCountHint: number )
	{
		/**
		 * Stride could be calculated with passing Enum but that causes Enum bundled as object in build code
		 * @see https://stackoverflow.com/questions/38034673/determine-the-number-of-enum-elements-typescript
		 */
		//const stride = Object.keys( enumType ).length / 2;

		this._maxSlots = nodeCountHint;
		this.stride = stride;
		this.table = new tableType( this._maxSlots * this.stride );
	}

	/**
	 * Adds a new slot to the table with the provided ID and full node data.
	 * 
	 * @param ID Unique identifier for the slot.
	 * @param allData Object containing a value for every enum key.
	 */
	addSlot( ID: SlotID, allData: EnumValueMap<EnumType> ): void
	{
		if ( this._slotIDToSlotPosition.get( ID ) ){
			console.warn( `ID: '${ ID }' already exist in the table.` );
		}

		const availableSlot = this._findEmptySlot();
		const emptyOffset = availableSlot * this.stride;

		// Object keys are always coerced to strings when you use the object literal syntax
		for ( const [ key, value ] of Object.entries<number>( allData ) ){
			this.table[ emptyOffset + Number( key ) ] = value;
		}

		this._slotIDToSlotPosition.set( ID, availableSlot );
		this._slotPositionToSlotID.set( availableSlot, ID );
		this.usedSlots += 1;
	}

	/**
	 * Removes the slot with the given ID from the table.
	 * 
	 * @param ID Slot ID to remove.
	 */
	removeSlot( ID: SlotID ): void 
	{
		/**
		 * Does not actually remove data; instead, it shifts the last slot's data to the removed slot,
		 * and updates available slots and used slots, avoiding a bulk sort operation.
		 */
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

	/**
	 * Modifies an existing slot identified by its ID with partial or complete data.
	 * 
	 * @param ID Slot ID to modify.
	 * @param data Object with at least one property defined
	 * @returns 
	 */
	modifySlotByID( ID: SlotID, data: RequireAtLeastOne<EnumValueMap<EnumType>> ): void
	{
		const slotPosition = this._slotIDToSlotPosition.get( ID );

		// Check for undefined; a boolean check is incorrect since ID might be 0
		if ( slotPosition === undefined ){
			console.warn( `ID: '${ ID }' is not found in the table.` );
			return;
		}

		this.modifySlotByPosition( slotPosition, data );
	}

	/**
	 * Updates a slot’s data when its table index (position) is already known.
	 * Useful for internal iteration or when the ID-to-position mapping is already available.
	 * 
	 * @param position Index of the slot in the table.
	 * @param data Partial or full node data.
	 */
	modifySlotByPosition( position: number, data: RequireAtLeastOne<EnumValueMap<EnumType>> ): void
	{
		const offset = position * this.stride;

		// Object keys are always coerced to strings when you use the object literal syntax
		for ( const [ key, value ] of Object.entries<number>( data ) ){
			this.table[ offset + Number( key ) ] = value;
		}
	}

	/**
	 * Retrieves a specific value from a slot by its ID and enum key.
	 * 
	 * @param ID Slot ID to get
	 * @param dataKey Enum key corresponding to the desired value.
	 * @returns The numeric value stored for that key in the slot, or undefined if the ID does not exist.
	 */
	getSlotData( ID: SlotID, dataKey: EnumType ): number | false
	{
		const slotPosition = this._slotIDToSlotPosition.get( ID );

		// Check for undefined; a boolean check is incorrect since ID might be 0
		if ( slotPosition === undefined ){
			console.warn( `ID: '${ ID }' is not found in the table.` );
			return false;
		}

		const offset = slotPosition * this.stride;
		return this.table[ offset + dataKey ];
	}

	/**
	 * Checks whether a slot with the given ID currently exists in the table.
	 * 
	 * @param ID Slot ID.
	 * @returns true if the slot exists; otherwise false.
	 */
	isSlotExist( ID: SlotID ): boolean
	{
		return this._slotIDToSlotPosition.has( ID );
	}

	/**
	 * Returns an available slot.
	 * Since we shift the last slot to the removed slot, 
	 * the empty slot should always equal to _usedSlots.
	 * 
	 * @internal
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
	 * 
	 * @internal
	 */
	private _expandCapacity(): void 
	{
		// Double the max slots
		const newMaxSlots = this._maxSlots * 2;

		// Create new table with increased size and copy old table onto it
		const newControlTable = new ( this.table.constructor as { new ( length: number ): NativeTableTypes } )( newMaxSlots * this.stride );
		newControlTable.set( this.table );

		// Update references and max slots
		this.table = newControlTable;
		this._maxSlots = newMaxSlots;
	}
}