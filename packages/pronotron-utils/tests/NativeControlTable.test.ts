import { NativeControlTable } from "../src/native-control-table/NativeControlTable";

// Small numeric enum for testing NativeControlTable
enum TestData {
	A,
	B,
	C,
};

describe( "NativeControlTable (unit)", () => {

	const stride = 3; // match TestData keys count

	let table: NativeControlTable<TestData>;

	beforeEach( () => {
		// default small capacity for easier expansion tests
		table = new NativeControlTable<TestData>( stride, Float32Array, 2 );
	} );

	test( "add() stores data, usedSlots increments and isExist() works (including ID=0)", () => {

		expect( table.usedSlots ).toBe( 0 );

		// add with string ID
		table.add( "one", {
			[ TestData.A ]: 1,
			[ TestData.B ]: 2,
			[ TestData.C ]: 3,
		} );

		expect( table.usedSlots ).toBe( 1 );

		expect( table.isExist( "one" ) ).toBe( true );
		expect( table.getData( "one", TestData.A ) ).toBe( 1 );
		expect( table.getData( "one", TestData.B ) ).toBe( 2 );
		expect( table.getData( "one", TestData.C ) ).toBe( 3 );

		// add with numeric ID 0 (exercise the slotPosition undefined-check edge case)
		table.add( 0, {
			[ TestData.A ]: 10,
			[ TestData.B ]: 11,
			[ TestData.C ]: 12,
		} );

		expect( table.usedSlots ).toBe( 2 );
		
		expect( table.isExist( 0 ) ).toBe( true );
		expect( table.getData( 0, TestData.C ) ).toBe( 12 );

	} );

	test( "getData() throws for non-existent ID", () => {
		expect( () => table.getData( "missing", TestData.A ) ).toThrow( /is not found/ );
	} );

	test( "modifyByPosition() updates typed array correctly", () => {

		table.add( "position0", {
			[ TestData.A ]: 1,
			[ TestData.B ]: 2,
			[ TestData.C ]: 3,
		} );
		table.add( "position1", {
			[ TestData.A ]: 1,
			[ TestData.B ]: 2,
			[ TestData.C ]: 3,
		} );

		// Modify items by positions
		table.modifyByPosition( 0, {
			[ TestData.A ]: 100,
			[ TestData.C ]: 10000,
		} );
		table.modifyByPosition( 1, {
			[ TestData.B ]: 10001,
		} );

		expect( table.getData( "position0", TestData.A ) ).toBe( 100 );
		expect( table.getData( "position0", TestData.B ) ).toBe( 2 );
		expect( table.getData( "position0", TestData.C ) ).toBe( 10000 );

		expect( table.getData( "position1", TestData.B ) ).toBe( 10001 );
		expect( table.getData( "position1", TestData.C ) ).toBe( 3 );

	} );

	test( "modifyByID() updates partial data and throws for missing ID", () => {

		table.add( "m1", {
			[ TestData.A ]: 5,
			[ TestData.B ]: 6,
			[ TestData.C ]: 7,
		} );

		table.modifyByID( "m1", {
			[ TestData.B ]: 60,
		} );

		expect( table.getData( "m1", TestData.A ) ).toBe( 5 );
		expect( table.getData( "m1", TestData.B ) ).toBe( 60 );
		expect( table.getData( "m1", TestData.C ) ).toBe( 7 );

		expect( () => table.modifyByID( "nope", { [ TestData.A ]: 1 } ) ).toThrow( /is not found/ );

	} );

	test( "remove() last slot simply decrements usedSlots", () => {

		table.add( "a", { 
			[ TestData.A ]: 1, 
			[ TestData.B ]: 2, 
			[ TestData.C ]: 3 
		} );
		table.add( "b", { 
			[ TestData.A ]: 4, 
			[ TestData.B ]: 5, 
			[ TestData.C ]: 6 
		} );

		expect( table.usedSlots ).toBe( 2 );

		// remove last one
		table.remove( "b" );

		expect( table.usedSlots ).toBe( 1 );
		expect( table.isExist( "b" ) ).toBe( false );

		// the remaining 'a' should still have its data
		expect( table.getData( "a", TestData.A ) ).toBe( 1 );
	} );

	test( "remove() middle slot shifts last slot into removed position", () => {

		// Prepare three slots (capacity is 2, table will expand automatically to fit)
		table.add( "s0", { [ TestData.A ]: 10, [ TestData.B ]: 11, [ TestData.C ]: 12 } );
		table.add( "s1", { [ TestData.A ]: 20, [ TestData.B ]: 21, [ TestData.C ]: 22 } );
		table.add( "s2", { [ TestData.A ]: 30, [ TestData.B ]: 31, [ TestData.C ]: 32 } );

		expect( table.usedSlots ).toBe( 3 );

		// remove middle s1 — implementation should move s2 into s1's position
		table.remove( "s1" );

		expect( table.usedSlots ).toBe( 2 );
		expect( table.isExist( "s1" ) ).toBe( false );

		// s2 must still exist and return its original values
		expect( table.isExist( "s2" ) ).toBe( true );
		expect( table.getData( "s2", TestData.A ) ).toBe( 30 );
		expect( table.getData( "s2", TestData.B ) ).toBe( 31 );
		expect( table.getData( "s2", TestData.C ) ).toBe( 32 );

		// s0 still contains original
		expect( table.getData( "s0", TestData.A ) ).toBe( 10 );

	} );

	test( "remove() throws for unknown ID", () => {
		expect( () => table.remove( "no-such" ) ).toThrow( /is not found/ );
	} );

	test( "add() warns when adding an already existing ID", () => {

		const warnSpy = jest.spyOn( console, "warn" ).mockImplementation( () => { } );

		// adding same ID again should trigger console.warn
		table.add( "dup", { [ TestData.A ]: 1, [ TestData.B ]: 2, [ TestData.C ]: 3 } );
		table.add( "dup", { [ TestData.A ]: 9, [ TestData.B ]: 8, [ TestData.C ]: 7 } );
		
		expect( warnSpy ).toHaveBeenCalled();
		warnSpy.mockRestore();

	} );

	test( "internal typed array expands when capacity reached (double capacity)", () => {

		// new table with nodeCountHint = 1 and small stride makes it easy to expand
		const small = new NativeControlTable<TestData>( stride, Float32Array, 1 );
		const initialLength = small.table.length; // stride * nodeCountHint
		
		expect( initialLength ).toBe( 3 * 1 );

		// Add two entries → will require expansion from 1 -> 2 maxSlots
		small.add( "x", { [ TestData.A ]: 1, [ TestData.B ]: 2, [ TestData.C ]: 3 } );
		expect( small.table.length ).toBe( initialLength ); // still old until expansion

		small.add( "y", { [ TestData.A ]: 4, [ TestData.B ]: 5, [ TestData.C ]: 6 } );
		
		// capacity should have been doubled; new length == stride * newMaxSlots
		expect( small.table.length ).toBe( 3 * 2 );

	} );

	test( "internal typed array stores related data type & truncate values", () => {

		enum MicroEnum { A };

		// new table with nodeCountHint = 1 and small stride makes it easy to expand
		const small = new NativeControlTable<MicroEnum>( 1, Uint8Array, 2 );
		small.add( "s1", { [ MicroEnum.A ]: 128.84 } );
		small.add( "s2", { [ MicroEnum.A ]: 258 } );

		expect( small.getData( "s1", MicroEnum.A ) ).toBe( 128 );

		/**
		 * @fix
		 * Directives should be added to library
		 */
		expect( small.getData( "s2", MicroEnum.A ) ).toBe( 2 ); // 258 - 256 = 2

	} );

} );
