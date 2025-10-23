import { PronotronIOVerticalObserver } from "../src/core/PronotronIOVertical";
import { IONodeStrideIndex, IONodePosition, FastForwardStrategy } from "../src/core/PronotronIOBase";
import type { IONodeOptions } from "../types/global";

describe( "PronotronIOVerticalObserver (behavior)", () => {

	let io: PronotronIOVerticalObserver;

	beforeEach( () => {
		io = new PronotronIOVerticalObserver( 10, true );
	} );

	test( "addNode() registers node", () => {

		const ref = {} as HTMLElement;
		const NODE_ID = io.addNode( {
			ref,
			getBounds: () => ( { start: 10, end: 20 } ),
			dispatch: {
				onInViewport: jest.fn(),
				onTopEnter: {
					dispatch: jest.fn(),
					limit: 3
				},
			},
			offset: 0,
			onRemoveNode: jest.fn()
		} );

		expect( typeof NODE_ID ).toBe( "number" );

	} );

	test( "addNode() with duplicated ref, returns false and warns", () => {

		const ref = {} as HTMLElement;
		
		const getBounds = () => ( { start: 0, end: 10 } );
		const dispatch = { onInViewport: jest.fn() };

		// First node should return number NodeID
		const NODE_ID1 = io.addNode( { ref, getBounds, dispatch } );
		expect( typeof NODE_ID1 ).toBe( "number" );

		// Adding another node with same ref should warn and return false
		const warnSpy = jest.spyOn( console, "warn" ).mockImplementation( () => {} );
		
		const NODE_ID2 = io.addNode( { ref, getBounds, dispatch } );
		
		expect( NODE_ID2 ).toBe( false );
		expect( warnSpy ).toHaveBeenCalled();

		warnSpy.mockRestore();

	} );

	test( "handleScroll() sets direction correctly", () => {

		io.setLastScroll( 0 );

		io.handleScroll( 10 );
		expect( io.direction ).toBe( "down" );

		io.handleScroll( 5 );
		expect( io.direction ).toBe( "up" );

		io.handleScroll( 1500 );
		expect( io.direction ).toBe( "down" );

	} );

	test( "negative -> viewport position transition triggers negative-enter handler", () => {

		io.updateViewportLayout( 0, 1000 );
		io.setLastScroll( 1000 ); // Visible area is [1000, 2000]

		const onTopEnter = jest.fn();
		const onTopExit = jest.fn();
		const onBottomEnter = jest.fn();
		const onBottomExit = jest.fn();
		const onInViewport = jest.fn();

		const ref = {} as HTMLElement;
		const dispatch = {
			onTopEnter,
			onTopExit,
			onBottomEnter,
			onBottomExit,
			onInViewport
		};
		const NODE_ID = io.addNode( { 
			ref, 
			dispatch,
			getBounds: () => ( { start: 900, end: 990 } ), 
		} );

		// IO node added successfully
		expect( typeof NODE_ID ).toBe( "number" );

		// Node still in the negative area
		io.handleScroll( 991 );

		// Now in the viewport
		io.handleScroll( 990 );

		// Now centre
		io.handleScroll( 945 );

		expect( onTopEnter ).toHaveBeenCalledTimes( 1 );
		expect( onInViewport ).toHaveBeenCalledTimes( 1 );

		expect( onTopExit ).not.toHaveBeenCalled();
		expect( onBottomExit ).not.toHaveBeenCalled();
		expect( onBottomEnter ).not.toHaveBeenCalled();

	} );

	test( "negative -> positive, fast-forward executes both events when strategy = execute_both", () => {

		io.updateViewportLayout( 0, 100 );

		const onTopEnter = jest.fn();
		const onTopExit = jest.fn();
		const onBottomEnter = jest.fn();
		const onBottomExit = jest.fn();
		const onInViewport = jest.fn();

		const ref = {} as HTMLElement;
		const dispatch = {
			onTopEnter,
			onTopExit,
			onBottomEnter,
			onBottomExit,
			onInViewport,
		};

		const _NODE_ID = io.addNode( { 
			ref, 
			dispatch: {
				...dispatch,
				onFastForward: "execute_both"
			},
			// Node sits at 150..160 (between states we can jump viewport around)
			getBounds: () => ( { start: 150, end: 160 } ), 
		} );

		// Jump viewport to 500 in a single step -> node will be InNegativeArea (fast-forward)
		io.handleScroll( 500 );
		expect( onBottomEnter ).toHaveBeenCalled();
		expect( onTopExit ).toHaveBeenCalled();

		// Jump viewport to 0 in a single step -> node will be InPositiveArea (fast-forward)
		io.handleScroll( 0 );
		expect( onTopEnter ).toHaveBeenCalled();
		expect( onBottomExit ).toHaveBeenCalled();
		
	} );

	test( "in-viewport callback receives normalized value and is executed on handleScroll", () => {

		const NodeEndPosition = 20;

		io.updateViewportLayout( 0, 100 );

		const ref = {} as HTMLElement;
		const onInViewport = jest.fn();

		// place node fully inside viewport (10..20)
		const NODE_ID = io.addNode( { 
			ref, 
			getBounds: () => ( { start: 10, end: NodeEndPosition } ), 
			dispatch: { 
				onInViewport 
			}
		} );

		// initial handleScroll: NotReady -> InViewport, onInViewport should be executed
		io.handleScroll( 0 );
		expect( onInViewport ).toHaveBeenCalledTimes( 1 );

		const normalized1 = onInViewport.mock.calls[ 0 ][ 0 ];

		// normalized should be between -1 and 1
		expect( normalized1 ).toBeGreaterThanOrEqual( -1 );
		expect( normalized1 ).toBeLessThanOrEqual( 1 );

		// Test the limit
		io.handleScroll( NodeEndPosition );
		const normalized2 = onInViewport.mock.calls[ 1 ][ 0 ];

		expect( normalized2 ).toBe( -1 );

	} );

	test( "limited dispatch handlers decrement limit and eventually clear flag", () => {

		io.updateViewportLayout( 0, 100 );

		const ref = {} as HTMLElement;
		const onTopExit = jest.fn();

		io.addNode( {
			ref,
			getBounds: () => ( { start: 10, end: 20 } ),
			dispatch: {
				onTopExit: {
					dispatch: onTopExit,
					limit: 2
				},
			}
		} );

		io.handleScroll( 0 );
		io.handleScroll( 200 );

		// First time: limit goes 2 -> 1 and flag remains 1
		expect( onTopExit ).toHaveBeenCalled();

		io.handleScroll( 0 );
		io.handleScroll( 200 );

		// second exit should drain limit to 0 and flag becomes 0
		expect( onTopExit ).toHaveBeenCalledTimes( 2 );

		io.handleScroll( 0 );
		io.handleScroll( 200 );

		// Flag should have been already cleared
		expect( onTopExit ).toHaveBeenCalledTimes( 2 );

	} );

	test( "removeNode removes and calls onRemoveNode and releases id", () => {

		io.updateViewportLayout( 0, 100 );

		const ref = {} as HTMLElement;
		const onRemove = jest.fn();

		const id = io.addNode( { 
			ref, 
			getBounds: () => ( { start: 10, end: 20 } ), 
			dispatch: {
				onInViewport: jest.fn()
			}, 
			onRemoveNode: onRemove 
		} );

		expect( typeof id ).toBe( "number" );
		io.removeNode( ref );

		// onRemoveNode invoked
		expect( onRemove ).toHaveBeenCalled();
		
	} );

	test( "expands table for very big scroll values", () => {

		io.updateViewportLayout( 0, 100 );

		/**
		 * @todo
		 * add checks to library
		 */
		io.updatePositions( 65535 + 1 );

	} );

} );