import { PointerState, PointerBase, BaseSettings } from '../../src/core/interaction/PointerBase';
import { PointerHoldable, HoldableSettings } from '../../src/core/interaction/PointerHoldable';
import { TouchController } from '../../src/core/input/Touch';

// Mock the entire module for PointerBase
jest.mock( '../../src/core/interaction/PointerBase', () => {
	const actual = jest.requireActual( '../../src/core/interaction/PointerBase' );
	return {
		...actual, // Keep PointerState as it is
		PointerBase: jest.fn(), // Mock the class
		BaseSettings: jest.fn(), // Mock the type/interface
	};
} );

// Mock the entire module for PointerHoldable
jest.mock( '../../src/core/interaction/PointerHoldable', () => ( {
	PointerHoldable: jest.fn(), // Mock the class
	HoldableSettings: jest.fn(), // Mock the type/interface
} ) );


/**
 * Creates a comprehensive mock of the `_model` (PointerBase or PointerHoldable)
 * that our controllers will interact with.
 */
const createMockModel = () => ( {
	_updateSettings: jest.fn(),
	_addEventListeners: jest.fn(),
	_removeEventListeners: jest.fn(),
	_onPointerStart: jest.fn(),
	_onPointerMove: jest.fn(),
	_onPointerEnd: jest.fn(),
	_updatePointer: jest.fn(),

	// Properties
	pointerTarget: null,
	_currentState: PointerState.IDLE,
	_canInteract: true,
	_pointerStart: { x: 10, y: 20, set: jest.fn() },
	_pointerEnd: { x: 10, y: 20, set: jest.fn() },
	_pointerDelta: { x: 1, y: 2 },
	_pointerDeltaAdditive: { x: 520, y: 150 },
} );


// Define a type for our mock model for better intellisense
type MockModel = ReturnType<typeof createMockModel>;

describe( 'TouchController Test Suite', () => {

	let mockModel: MockModel;
	let controller: TouchController;

	/**
	 * Creates a mock MouseEvent.
	 */
	const createMockTouchEvent = ( props = {} ) =>
	( {
		touches: [
			{
				clientX: 100,
				clientY: 200,
				...props
			},
		]
	} as unknown as TouchEvent );

	beforeEach( () => {

		jest.clearAllMocks();
		mockModel = createMockModel();
		controller = new TouchController(
			mockModel as unknown as PointerBase | PointerHoldable,
		);

	} );

	describe( 'Initialization', () => {

		it( 'should add pointer listeners if startEvents() returns true', () => {

			controller.startEvents();

			expect( mockModel._addEventListeners ).toHaveBeenCalledTimes( 1 );
			expect( mockModel._addEventListeners ).toHaveBeenCalledWith(
				[ 'touchstart', controller._onPointerStart ],
			);

		} );

		it( 'should NOT add listeners if startEvents() returns false', () => {

			controller.startEvents();

			expect( mockModel._addEventListeners ).toHaveBeenCalledTimes( 1 );

			controller.startEvents();

			expect( mockModel._addEventListeners ).toHaveBeenCalledTimes( 1 );

		} );

		it( 'should remove all event listeners on stopEvents', () => {

			controller.stopEvents();

			expect( mockModel._removeEventListeners ).toHaveBeenCalledTimes( 1 );
			expect( mockModel._removeEventListeners ).toHaveBeenCalledWith(
				[ "touchstart", controller._onPointerStart ],
				[ "touchmove", controller._onPointerMove ],
				[ "touchend", controller._onPointerEnd ],
			);

		} );

	} );

	describe( '_getPointerPosition', () => {

		it( 'should get correct pointer position from a MouseEvent', () => {

			const randomX = Math.random() * 500;
			const randomY = Math.random() * 500;

			const event = createMockTouchEvent( { clientX: randomX, clientY: randomY } );
			const pos = controller._getPointerPosition( event );

			expect( pos ).toEqual( { x: randomX, y: randomY } );

		} );

	} );

	describe( '_onPointerStart', () => {

		it( 'should handle _onPointerStart by adding listeners and delegating', () => {

			const event = createMockTouchEvent();
			controller._onPointerStart( event );

			expect( mockModel._addEventListeners ).toHaveBeenCalledWith(
				[ 'touchmove', controller._onPointerMove ],
				[ 'touchend', controller._onPointerEnd ],
			);
			expect( mockModel._onPointerStart ).toHaveBeenCalledWith( event );

		} );

	} );

	describe( '_onPointerEnd', () => {
		
		it( 'should handle pointerend, removing listeners, and delegating', () => {

			const event = createMockTouchEvent();

			mockModel._currentState = PointerState.MOVING;
			controller._onPointerEnd( event );

			// Verify private property state
			expect( mockModel._removeEventListeners ).toHaveBeenCalledWith(
				[ 'touchmove', controller._onPointerMove ],
				[ 'touchend', controller._onPointerEnd ],
			);
			expect( mockModel._onPointerEnd ).toHaveBeenCalledWith( event );

		} );
		
	} );

	describe( '_onPointerMove', () => {

		it( 'should update pointer and delegate if state is MOVING', () => {

			const randomX = Math.random() * 500;
			const randomY = Math.random() * 500;

			const event = createMockTouchEvent( { clientX: randomX, clientY: randomY } );
			mockModel._currentState = PointerState.MOVING;

			controller._onPointerMove( event );

			expect( mockModel._pointerStart.set ).not.toHaveBeenCalled();
			expect( mockModel._updatePointer ).toHaveBeenCalledWith( randomX, randomY );
			expect( mockModel._onPointerMove ).toHaveBeenCalledWith( event );

		} );

	} );

} );