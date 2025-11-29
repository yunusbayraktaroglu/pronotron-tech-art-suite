import { IOVerticalOptions, PronotronIOVerticalObserver } from "../src/core/PronotronIOVertical";
import { IONodeStrideIndex, IONodePosition, FastForwardStrategy } from "../src/core/PronotronIOBase";
import type { IODispatchOptions, IONodeOptions } from "../types/global";

type PossibleEvents = Required<Omit<IOVerticalOptions[ "dispatch" ], "onFastForward">>;

describe( "PronotronIOVerticalObserver (behavior)", () => {

	let io: PronotronIOVerticalObserver;
	let fullDispatch: PossibleEvents;

	beforeEach( () => {
		io = new PronotronIOVerticalObserver( 10, true );
		fullDispatch = {
			// Direction agnostic
			onExit: jest.fn(),
			onEnter: jest.fn(),
			// Continuous
			onScrollProgress: jest.fn(),
			onInViewport: jest.fn(),
			// Direction specific
			onTopEnter: jest.fn(),
			onTopExit: jest.fn(),
			onBottomEnter: jest.fn(),
			onBottomExit: jest.fn(),
		};
	} );

	describe( 'Initialization and basic methods', () => {
	
		it( 'addNode() registers node', () => {

			const ref = {} as HTMLElement;

			const NODE_ID = io.addNode( {
				ref,
				getBounds: () => ( { start: 10, end: 20 } ),
				dispatch: fullDispatch,
				offset: 0,
				onRemoveNode: jest.fn()
			} );

			expect( typeof NODE_ID ).toBe( "number" );

		} );

		it( 'addNode() with duplicated ref, returns false and warns', () => {

			const ref = {} as HTMLElement;
			
			const getBounds = () => ( { start: 0, end: 10 } );

			// First node should return number NodeID
			const NODE_ID1 = io.addNode( { ref, getBounds, dispatch: fullDispatch } );
			expect( typeof NODE_ID1 ).toBe( "number" );

			// Adding another node with same ref should warn and return false
			const warnSpy = jest.spyOn( console, "warn" ).mockImplementation( () => {} );
			
			const NODE_ID2 = io.addNode( { ref, getBounds, dispatch: fullDispatch } );
			
			expect( NODE_ID2 ).toBe( false );
			expect( warnSpy ).toHaveBeenCalled();

			warnSpy.mockRestore();

		} );

		it( 'removeNode() removes and calls onRemoveNode and releases id', () => {

			const ref = {} as HTMLElement;
			const onRemove = jest.fn();

			const NODE_ID = io.addNode( { 
				ref, 
				getBounds: () => ( { start: 10, end: 20 } ), 
				dispatch: {
					onInViewport: jest.fn()
				}, 
				onRemoveNode: onRemove 
			} );

			expect( typeof NODE_ID ).toBe( "number" );
			io.removeNode( ref );

			expect( onRemove ).toHaveBeenCalled();
			
		} );

		it( "handleScroll() sets direction correctly", () => {

			io.setLastScroll( 0 );

			io.handleScroll( 10 );
			expect( io.direction ).toBe( "down" );

			io.handleScroll( 5 );
			expect( io.direction ).toBe( "up" );

			io.handleScroll( 1500 );
			expect( io.direction ).toBe( "down" );

		} );

		it( 'expands table for very big scroll values', () => {

			io.updateViewportLayout( 0, 100 );

			// Setting max scroll value beyond 65535 should trigger expansion
			io.updatePositions( 65535 + 1 );

		} );

		it( 'limited dispatch handlers decrement limit and eventually clear flag', () => {

			const limitCount = 5;

			// Visible area is [0, 100]
			io.updateViewportLayout( 0, 100 );
			io.setLastScroll( 0 );

			const ref = {} as HTMLElement;
			const onTopExit = jest.fn();
			const onTopEnter = jest.fn();

			io.addNode( {
				ref,
				getBounds: () => ( { start: 10, end: 20 } ),
				dispatch: {
					onTopExit: {
						dispatch: onTopExit,
						limit: limitCount
					},
					onTopEnter: {
						dispatch: onTopEnter,
						limit: limitCount
					},
				}
			} );

			// Scroll up and down multiple times
			for ( let i = 0; i < limitCount + 5; i++ ){

				io.handleScroll( 200 );
				io.handleScroll( 0 );

				// Call count should not exceed limitCount
				const count = Math.min( i + 1, limitCount );

				expect( onTopExit ).toHaveBeenCalledTimes( count );
				expect( onTopEnter ).toHaveBeenCalledTimes( count );

			}

		} );

		it( 'returns correct node position states', () => {

			// Setup nodes in different positions
			const NODE_ID_1 = io.addNode( { 
				ref: {} as HTMLElement, 
				getBounds: () => ( { start: 500, end: 600 } ), 
				dispatch: {
					onInViewport: jest.fn()
				}, 
			} ) as number;

			const NODE_ID_2 = io.addNode( { 
				ref: {} as HTMLElement,
				getBounds: () => ( { start: 2100, end: 2200 } ), 
				dispatch: {
					onInViewport: jest.fn()
				}, 
			} ) as number;

			const NODE_ID_3 = io.addNode( { 
				ref: {} as HTMLElement, 
				getBounds: () => ( { start: 1500, end: 1600 } ), 
				dispatch: {
					onInViewport: jest.fn()
				}, 
			} ) as number;

			expect( typeof NODE_ID_1 ).toBe( "number" );
			expect( typeof NODE_ID_2 ).toBe( "number" );
			expect( typeof NODE_ID_3 ).toBe( "number" );

			// If below viewport layout is not set, all nodes should be NotReady
			
			// io.updateViewportLayout( 0, 1000 );
			// io.setLastScroll( 1000 ); // Visible area is [1000, 2000]

			expect( io.getNodePosition( NODE_ID_1 ) ).toBe( IONodePosition.NotReady );
			expect( io.getNodePosition( NODE_ID_2 ) ).toBe( IONodePosition.NotReady );
			expect( io.getNodePosition( NODE_ID_3 ) ).toBe( IONodePosition.NotReady );

			io.updateViewportLayout( 0, 1000 );
			io.handleScroll( 1000 ); // Visible area is [1000, 2000]

			expect( io.getNodePosition( NODE_ID_1 ) ).toBe( IONodePosition.InNegativeArea );
			expect( io.getNodePosition( NODE_ID_2 ) ).toBe( IONodePosition.InPositiveArea );
			expect( io.getNodePosition( NODE_ID_3 ) ).toBe( IONodePosition.InViewport );
		} );

	} );

	describe( 'Transition tests', () => {
		
		it( "negative → viewport position transition triggers negative-enter handlers", () => {

			io.updateViewportLayout( 0, 1000 );
			io.setLastScroll( 1000 ); // Visible area is [1000, 2000]

			const ref = {} as HTMLElement;

			// Add node in negative area
			const NODE_ID = io.addNode( { 
				ref, 
				dispatch: fullDispatch,
				getBounds: () => ( { start: 900, end: 990 } ), 
			} );

			// Node still in the negative area
			io.handleScroll( 991 );

			// Now in the viewport
			io.handleScroll( 990 );

			// Now centered
			io.handleScroll( 945 );

			expect( fullDispatch.onScrollProgress ).toHaveBeenCalledTimes( 2 );
			expect( fullDispatch.onInViewport ).toHaveBeenCalledTimes( 2 );
			expect( fullDispatch.onEnter ).toHaveBeenCalledTimes( 1 );
			expect( fullDispatch.onTopEnter ).toHaveBeenCalledTimes( 1 );

			expect( fullDispatch.onTopExit ).not.toHaveBeenCalled();
			expect( fullDispatch.onBottomExit ).not.toHaveBeenCalled();
			expect( fullDispatch.onBottomEnter ).not.toHaveBeenCalled();
			expect( fullDispatch.onExit ).not.toHaveBeenCalled();

		} );

		it( "viewport → positive position transition triggers positive-exit handlers", () => {

			io.updateViewportLayout( 0, 1000 );
			io.setLastScroll( 1000 ); // Visible area is [1000, 2000]

			const ref = {} as HTMLElement;

			// Add node in viewport
			const NODE_ID = io.addNode( { 
				ref, 
				dispatch: fullDispatch,
				getBounds: () => ( { start: 1100, end: 1200 } ), 
			} );

			// Node in the viewport
			io.handleScroll( 110 );

			// Now in positive area (exited)
			io.handleScroll( 99 );

			expect( fullDispatch.onScrollProgress ).toHaveBeenCalledTimes( 1 );
			expect( fullDispatch.onInViewport ).toHaveBeenCalledTimes( 1 );
			expect( fullDispatch.onExit ).toHaveBeenCalledTimes( 1 );
			expect( fullDispatch.onBottomExit ).toHaveBeenCalledTimes( 1 );

			expect( fullDispatch.onBottomEnter ).not.toHaveBeenCalled();
			expect( fullDispatch.onEnter ).not.toHaveBeenCalled();
			expect( fullDispatch.onTopExit ).not.toHaveBeenCalled();
			expect( fullDispatch.onTopEnter ).not.toHaveBeenCalled();

		} );

		it( "positive → viewport position transition triggers positive-enter handlers", () => { 

			io.updateViewportLayout( 0, 1000 );
			io.setLastScroll( 1000 ); // Visible area is [1000, 2000]

			const ref = {} as HTMLElement;

			// Add node in positive area
			const NODE_ID = io.addNode( { 
				ref, 
				dispatch: fullDispatch,
				getBounds: () => ( { start: 2100, end: 2200 } ), 
			} );

			// Node still in the positive area
			io.handleScroll( 1090 );

			// Now in the viewport
			io.handleScroll( 1100 );

			// Now centered
			io.handleScroll( 1500 );

			expect( fullDispatch.onScrollProgress ).toHaveBeenCalledTimes( 2 );
			expect( fullDispatch.onInViewport ).toHaveBeenCalledTimes( 2 );
			expect( fullDispatch.onEnter ).toHaveBeenCalledTimes( 1 );
			expect( fullDispatch.onBottomEnter ).toHaveBeenCalledTimes( 1 );

			expect( fullDispatch.onTopExit ).not.toHaveBeenCalled();
			expect( fullDispatch.onTopEnter ).not.toHaveBeenCalled();
			expect( fullDispatch.onBottomExit ).not.toHaveBeenCalled();
			expect( fullDispatch.onExit ).not.toHaveBeenCalled();

		} );

		it( "viewport → negative position transition triggers negative-exit handlers", () => { 

			io.updateViewportLayout( 0, 1000 );
			io.setLastScroll( 1000 ); // Visible area is [1000, 2000]

			const ref = {} as HTMLElement;

			// Add node in viewport
			const NODE_ID = io.addNode( { 
				ref, 
				dispatch: fullDispatch,
				getBounds: () => ( { start: 1100, end: 1200 } ), 
			} );

			// Node in the viewport
			io.handleScroll( 1050 );

			// Now in negative area (exited)
			io.handleScroll( 1500 );

			expect( fullDispatch.onScrollProgress ).toHaveBeenCalledTimes( 1 );
			expect( fullDispatch.onInViewport ).toHaveBeenCalledTimes( 1 );
			expect( fullDispatch.onExit ).toHaveBeenCalledTimes( 1 );
			expect( fullDispatch.onTopExit ).toHaveBeenCalledTimes( 1 );

			expect( fullDispatch.onEnter ).not.toHaveBeenCalled();
			expect( fullDispatch.onBottomEnter ).not.toHaveBeenCalled();
			expect( fullDispatch.onBottomExit ).not.toHaveBeenCalled();
			expect( fullDispatch.onTopEnter ).not.toHaveBeenCalled();

		} );

	} );

	describe( 'Fast-forward tests', () => {

		const onTopEnter = jest.fn();
		const onTopExit = jest.fn();
		const onBottomEnter = jest.fn();
		const onBottomExit = jest.fn();

		const ref = {} as HTMLElement;
		const dispatch = { onTopEnter, onTopExit, onBottomEnter, onBottomExit }; // Direction specific only

		beforeEach( () => {

			// Clear call counts and mock results
			jest.clearAllMocks(); 

			// Visible area is [500, 1000]
			io.updateViewportLayout( 0, 500 );
			io.setLastScroll( 500 ); 

		} );

		it( 'Fast-forward executes both events when strategy = execute_both', () => {

			const _NODE_ID = io.addNode( { 
				ref, 
				dispatch: {
					...dispatch,
					onFastForward: "execute_both"
				},
				getBounds: () => ( { start: 1500, end: 1600 } ), 
			} );

			// Visible area is [2000, 2500], node will be InNegativeArea (fast-forward)
			io.handleScroll( 2000 );

			expect( onBottomEnter ).toHaveBeenCalled();
			expect( onTopExit ).toHaveBeenCalled();

			// Visible area is [0, 500], node will be InPositiveArea (fast-forward)
			io.handleScroll( 0 );
			
			expect( onTopEnter ).toHaveBeenCalled();
			expect( onBottomExit ).toHaveBeenCalled();
			
		} );

		it( 'Fast-forward do not executes any events when strategy = skip_both', () => {

			const _NODE_ID = io.addNode( { 
				ref, 
				dispatch: {
					...dispatch,
					onFastForward: "skip_both"
				},
				getBounds: () => ( { start: 1500, end: 1600 } ), 
			} );

			// Visible area is [2000, 2500], node will be InNegativeArea (fast-forward)
			io.handleScroll( 2000 );

			expect( onBottomEnter ).not.toHaveBeenCalled();
			expect( onTopExit ).not.toHaveBeenCalled();

			// Visible area is [0, 500], node will be InPositiveArea (fast-forward)
			io.handleScroll( 0 );
			
			expect( onTopEnter ).not.toHaveBeenCalled();
			expect( onBottomExit ).not.toHaveBeenCalled();
			
		} );

		it( 'Fast-forward executes last event when strategy = execute_last', () => {

			const _NODE_ID = io.addNode( { 
				ref, 
				dispatch: {
					...dispatch,
					onFastForward: "execute_last"
				},
				getBounds: () => ( { start: 1500, end: 1600 } ), 
			} );

			// Visible area is [2000, 2500], node will be InNegativeArea (fast-forward)
			io.handleScroll( 2000 );

			expect( onBottomEnter ).not.toHaveBeenCalled();
			expect( onTopExit ).toHaveBeenCalled();

			// Visible area is [0, 500], node will be InPositiveArea (fast-forward)
			io.handleScroll( 0 );
			
			expect( onTopEnter ).not.toHaveBeenCalled();
			expect( onBottomExit ).toHaveBeenCalled();
			
		} );
	} );

	describe( 'Continious events tests', () => { 

		it( 'onInViewport callback receives normalized value and is executed on handleScroll', () => {

			const nodeStartPosition = 100;
			const nodeEndPosition = 150;

			io.updateViewportLayout( 0, 100 );
			io.setLastScroll( 0 ); // Visible area is [0, 100]

			const ref = {} as HTMLElement;
			const onInViewport = jest.fn();
			const onScrollProgress = jest.fn();

			const NODE_ID = io.addNode( { 
				ref, 
				getBounds: () => ( { start: nodeStartPosition, end: nodeEndPosition } ), 
				dispatch: { 
					onInViewport,
					onScrollProgress
				}
			} );

			io.handleScroll( 1 ); // Visible area is [1, 101]

			expect( onInViewport ).toHaveBeenCalledTimes( 1 );
			expect( onScrollProgress ).toHaveBeenCalledTimes( 1 );

			//const normalizedViewPosition = jest.mocked( onInViewport ).mock.lastCall[ 0 ];

			const normalizedViewPosition = onInViewport.mock.calls[ 0 ][ 0 ];
			const normalizedScrollPosition = onScrollProgress.mock.calls[ 0 ][ 0 ];

			// normalizedViewPosition should be between -1 and 1
			expect( normalizedViewPosition ).toBeGreaterThanOrEqual( -1 );
			expect( normalizedViewPosition ).toBeLessThanOrEqual( 1 );

			// normalizedScrollPosition should be between 0 and 1
			expect( normalizedScrollPosition ).toBeGreaterThanOrEqual( 0 );
			expect( normalizedScrollPosition ).toBeLessThanOrEqual( 1 );

			// Test the limit
			io.handleScroll( 150 ); // Visible area is [150, 250]
			const normalizedViewPosition2 = onInViewport.mock.calls[ 1 ][ 0 ];
			const normalizedScrollPosition2 = onScrollProgress.mock.calls[ 1 ][ 0 ];

			expect( normalizedViewPosition2 ).toBe( -1 );
			expect( normalizedScrollPosition2 ).toBe( 1 );

		} );
		
	} );

} );