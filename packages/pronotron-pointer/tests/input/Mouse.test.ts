import { PointerState, PointerBase, BaseSettings } from '../../src/core/interaction/PointerBase';
import { PointerHoldable, HoldableSettings } from '../../src/core/interaction/PointerHoldable';
import { MouseController } from '../../src/core/input/Mouse';

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
	_startEvents: jest.fn( () => true ), // Default to success
	_stopEvents: jest.fn(),
	_addEventListeners: jest.fn(),
	_removeEventListeners: jest.fn(),
	_onPointerStart: jest.fn(),
	_onPointerMove: jest.fn(),
	_onPointerEnd: jest.fn(),
	_updatePointer: jest.fn(),

	// Properties
	_currentState: PointerState.IDLE,
	_canInteract: true,
	_pointerStart: { x: 10, y: 20, set: jest.fn() },
	_pointerEnd: { x: 10, y: 20, set: jest.fn() },
	_pointerDelta: { x: 1, y: 2 },
	_pointerDeltaAdditive: { x: 520, y: 150 },
} );

/**
 * Creates a mock MouseEvent.
 */
const createMockMouseEvent = ( props = {} ) =>
( {
	clientX: 100,
	clientY: 200,
	...props,
} as unknown as MouseEvent );

// Define a type for our mock model for better intellisense
type MockModel = ReturnType<typeof createMockModel>;

describe( 'MouseController Test Suite', () => {

	let mockModel: MockModel;
	let controller: MouseController;

	beforeEach( () => {
		jest.clearAllMocks(); // Clear all mock states
		mockModel = createMockModel();
		controller = new MouseController(
			mockModel as unknown as PointerBase | PointerHoldable,
		);
	} );

	describe( 'startEvents', () => {

		it( 'should add pointer listeners if model._startEvents returns true', () => {

			mockModel._startEvents.mockReturnValue( true );
			controller.startEvents();

			expect( mockModel._startEvents ).toHaveBeenCalledTimes( 1 );
			expect( mockModel._addEventListeners ).toHaveBeenCalledTimes( 1 );
			expect( mockModel._addEventListeners ).toHaveBeenCalledWith(
				[ 'pointerdown', controller._onPointerStart ],
				[ 'pointermove', controller._onPointerMove ],
				[ 'pointerleave', controller._onPointerLeave ],
				[ 'dragstart', controller._onDragStart ],
			);

		} );

		it( 'should NOT add listeners if model._startEvents returns false', () => {

			mockModel._startEvents.mockReturnValue( false );
			controller.startEvents();

			expect( mockModel._startEvents ).toHaveBeenCalledTimes( 1 );
			expect( mockModel._addEventListeners ).not.toHaveBeenCalled();

		} );

	} );

	it( 'should remove all event listeners on stopEvents', () => {

		controller.stopEvents();

		expect( mockModel._stopEvents ).toHaveBeenCalledTimes( 1 );
		expect( mockModel._removeEventListeners ).toHaveBeenCalledTimes( 1 );
		expect( mockModel._removeEventListeners ).toHaveBeenCalledWith(
			[ 'pointerdown', controller._onPointerStart ],
			[ 'pointermove', controller._onPointerMove ],
			[ 'pointerup', controller._onPointerEnd ],
			[ 'pointercancel', controller._onPointerEnd ],
			[ 'pointerleave', controller._onPointerLeave ],
			[ 'dragstart', controller._onDragStart ],
			[ 'dragover', controller._onPointerMove ],
			[ 'dragend', controller._onDragEnd ],
		);

	} );

	it( 'should get correct pointer position from a MouseEvent', () => {

		const event = createMockMouseEvent( { clientX: 123, clientY: 456 } );
		const pos = controller._getPointerPosition( event );

		expect( pos ).toEqual( { x: 123, y: 456 } );

	} );

	it( 'should handle _onPointerStart by adding listeners and delegating', () => {

		const event = createMockMouseEvent();
		controller._onPointerStart( event );

		expect( mockModel._addEventListeners ).toHaveBeenCalledWith(
			[ 'pointerup', controller._onPointerEnd ],
			[ 'pointercancel', controller._onPointerEnd ],
		);
		expect( mockModel._onPointerStart ).toHaveBeenCalledWith( event );

	} );

	describe( '_onPointerEnd', () => {
		
		it( 'should handle pointer end by setting skipMove, removing listeners, and delegating', () => {

			const event = createMockMouseEvent();
			mockModel._currentState = PointerState.MOVING;
			controller._onPointerEnd( event );

			// Verify private property state
			expect( controller[ '_skipMove' ] ).toBe( true );
			expect( mockModel._removeEventListeners ).toHaveBeenCalledWith(
				[ 'pointerup', controller._onPointerEnd ],
				[ 'pointercancel', controller._onPointerEnd ],
			);
			expect( mockModel._onPointerEnd ).toHaveBeenCalledWith( event );

		} );

		it( 'should NOT delegate to model._onPointerEnd if state is DRAGGING', () => {

			const event = createMockMouseEvent();
			mockModel._currentState = PointerState.DRAGGING;
			controller._onPointerEnd( event );

			expect( controller[ '_skipMove' ] ).toBe( true );
			expect( mockModel._removeEventListeners ).toHaveBeenCalled();
			// This is the key assertion
			expect( mockModel._onPointerEnd ).not.toHaveBeenCalled();

		} );
		
	} );

	describe( '_onPointerMove', () => {
		
		it( 'should skip move if _skipMove is true', () => {

			const event = createMockMouseEvent();
			controller[ '_skipMove' ] = true; // Set private property
			controller._onPointerMove( event );

			expect( controller[ '_skipMove' ] ).toBe( false ); // Should be reset
			expect( mockModel._updatePointer ).not.toHaveBeenCalled();
			expect( mockModel._onPointerMove ).not.toHaveBeenCalled();

		} );

		it( 'should reset pointer start/end if state was OUTSIDE', () => {

			const event = createMockMouseEvent( { clientX: 300, clientY: 400 } );
			mockModel._currentState = PointerState.OUTSIDE;
			controller[ '_skipMove' ] = false;

			controller._onPointerMove( event );

			expect( mockModel._pointerStart.set ).toHaveBeenCalledWith( 300, 400 );
			expect( mockModel._pointerEnd.set ).toHaveBeenCalledWith( 300, 400 );
			expect( mockModel._currentState ).toBe( PointerState.MOVING );
			expect( mockModel._updatePointer ).toHaveBeenCalledWith( 300, 400 );
			expect( mockModel._onPointerMove ).toHaveBeenCalledWith( event );

		} );

		it( 'should only update pointer if state is DRAGGING', () => {

			const event = createMockMouseEvent( { clientX: 300, clientY: 400 } );
			mockModel._currentState = PointerState.DRAGGING;
			controller[ '_skipMove' ] = false;

			controller._onPointerMove( event );

			expect( mockModel._pointerStart.set ).not.toHaveBeenCalled();
			expect( mockModel._updatePointer ).toHaveBeenCalledWith( 300, 400 );
			// Key assertion: _onPointerMove is NOT called
			expect( mockModel._onPointerMove ).not.toHaveBeenCalled();

		} );

		it( 'should update pointer and delegate if state is MOVING', () => {

			const event = createMockMouseEvent( { clientX: 300, clientY: 400 } );
			mockModel._currentState = PointerState.MOVING;
			controller[ '_skipMove' ] = false;

			controller._onPointerMove( event );

			expect( mockModel._pointerStart.set ).not.toHaveBeenCalled();
			expect( mockModel._updatePointer ).toHaveBeenCalledWith( 300, 400 );
			expect( mockModel._onPointerMove ).toHaveBeenCalledWith( event );
			
		} );

	} );

	describe( '_onPointerLeave', () => {

		it( 'should set state to OUTSIDE', () => {

			const event = createMockMouseEvent();
			mockModel._currentState = PointerState.MOVING;
			controller._onPointerLeave( event );

			expect( mockModel._onPointerEnd ).not.toHaveBeenCalled();
			expect( mockModel._currentState ).toBe( PointerState.OUTSIDE );

		} );

		it( 'should call _onPointerEnd if state was HOLD_DRAGGING', () => {

			const event = createMockMouseEvent();
			mockModel._currentState = PointerState.HOLD_DRAGGING;
			controller._onPointerLeave( event );

			expect( mockModel._onPointerEnd ).toHaveBeenCalledWith( event );
			expect( mockModel._currentState ).toBe( PointerState.OUTSIDE );

		} );
		
	} );

	it( 'should handle _onDragStart by adding listeners and setting state', () => {

		const event = {} as Event; // DragEvent is complex, generic Event is fine
		controller._onDragStart( event );

		expect( mockModel._addEventListeners ).toHaveBeenCalledWith(
			[ 'dragover', controller._onPointerMove ],
			[ 'dragend', controller._onDragEnd ],
		);
		expect( mockModel._currentState ).toBe( PointerState.DRAGGING );

	} );

	it( 'should handle _onDragEnd by removing listeners and setting state', () => {

		const event = {} as Event;
		controller._onDragEnd( event );

		expect( mockModel._removeEventListeners ).toHaveBeenCalledWith(
			[ 'dragover', controller._onPointerMove ],
			[ 'dragend', controller._onDragEnd ],
		);
		expect( mockModel._currentState ).toBe( PointerState.IDLE );

	} );

} );