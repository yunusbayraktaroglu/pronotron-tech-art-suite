import { IDPool } from "../src/utils/IDPool";

describe( "IDPool (LIFO Stack Version)", () => {

	let pool: IDPool;

	beforeEach( () => {
		pool = new IDPool( 3 ); // small initial capacity for tests
	} );

	test( "get() returns IDs from the top of the stack in LIFO order", () => {

		// Stack is initialized as [0, 1, 2] with top at 3.
		// get() pops from the top, so it returns 2 -> 1 -> 0.
		expect( pool.get() ).toBe( 2 );
		expect( pool.get() ).toBe( 1 );
		expect( pool.get() ).toBe( 0 );

	} );

	test( "when all ids are used, get() expands capacity and pops the newest minted ID", () => {

		// Empty the initial pool
		pool.get(); // 2
		pool.get(); // 1
		pool.get(); // 0

		// Pool is empty. Next get() triggers expansion to capacity 6.
		// It pushes [3, 4, 5] onto the stack and pops the top one (5).
		expect( pool.get() ).toBe( 5 );
		
		// Subsequent gets return the rest of the newly minted chunk
		expect( pool.get() ).toBe( 4 );
		expect( pool.get() ).toBe( 3 );

	} );

	test( "release() pushes ID back to stack, making it the very next ID returned", () => {

		const id1 = pool.get(); // 2
		const id2 = pool.get(); // 1
		pool.get();             // 0

		// Release 1, then release 2.
		// Stack top receives 1, then 2.
		pool.release( id2 );
		pool.release( id1 );

		// Next get() should pop the LAST released ID (LIFO: 2)
		expect( pool.get() ).toBe( id1 ); // 2
		
		// Next get() should pop the preceding released ID (1)
		expect( pool.get() ).toBe( id2 ); // 1

	} );

	test( "multiple expansions double capacity and manage the LIFO chunks correctly", () => {

		// Start capacity = 1 to force multiple expansions quickly
		const small = new IDPool( 1 );
		const got: number[] = [];
		
		for ( let i = 0; i < 8; i++ ) {
			got.push( small.get() );
		}
		
		// Expected LIFO extraction sequence:
		// Cap 1: prefilled [0]          -> pops 0
		// Exp 2: pushes [1]             -> pops 1
		// Exp 4: pushes [2, 3]          -> pops 3, then 2
		// Exp 8: pushes [4, 5, 6, 7]    -> pops 7, 6, 5, 4
		expect( got ).toEqual( [ 0, 1, 3, 2, 7, 6, 5, 4 ] );

	} );
} );
