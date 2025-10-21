// IDPool.test.ts
import { IDPool } from "../src/utils/IDPool"; // adjust path if needed

describe( "IDPool (unit)", () => {

	let pool: IDPool;

	beforeEach( () => {
		pool = new IDPool( 3 ); // small initial capacity for tests
	} );

	test( "get() returns lowest available id and consume marks it used", () => {

		const a = pool.get();
		expect( a ).toBe( 0 );
		pool.consume( a );

		const b = pool.get();
		expect( b ).toBe( 1 );
		pool.consume( b );

		const c = pool.get();
		expect( c ).toBe( 2 );
		pool.consume( c );

	} );

	test( "when all ids used get() expands capacity and returns next id (old capacity)", () => {

		// Fill initial capacity (3)
		pool.consume( pool.get() ); // 0
		pool.consume( pool.get() ); // 1
		pool.consume( pool.get() ); // 2

		// Now all used. Next get should return 3 (old capacity) and trigger expansion.
		const next = pool.get();
		expect( next ).toBe( 3 );

		// After expansion, subsequent get returns 4 (next free)
		pool.consume( next );

		const next2 = pool.get();
		expect( next2 ).toBe( 4 );

	} );

	test( "release() frees id and get() returns lowest freed id", () => {

		const ids: number[] = [];

		ids.push( pool.get() ); pool.consume( ids[ 0 ] ); // 0
		ids.push( pool.get() ); pool.consume( ids[ 1 ] ); // 1
		ids.push( pool.get() ); pool.consume( ids[ 2 ] ); // 2

		// Expand once
		const id3 = pool.get(); pool.consume( id3 ); // 3

		// Release id 1 and 0, should be reused in get()
		pool.release( 1 );
		const reused = pool.get();
		expect( reused ).toBe( 1 );

		// Release 0 and expect next get to return 0 (lowest available)
		pool.release( 0 );
		const reused0 = pool.get();
		expect( reused0 ).toBe( 0 );

	} );

	test( "multiple expansions double capacity each time (behavioral check)", () => {

		// Start capacity = 1 to force multiple expansions quickly
		const small = new IDPool( 1 );
		const got: number[] = [];
		
		// consume a bunch to force expansions: 0..7
		for ( let i = 0; i < 8; i++ ) {
			const id = small.get();
			got.push( id );
			small.consume( id );
		}
		// We expect returned ids are sequential starting at 0
		expect( got ).toEqual( [ 0, 1, 2, 3, 4, 5, 6, 7 ] );

	} );
} );
