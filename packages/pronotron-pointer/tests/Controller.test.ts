import { PointerState, PointerBase, BaseSettings } from '../src/core/interaction/PointerBase';
import { PointerHoldable, HoldableSettings } from '../src/core/interaction/PointerHoldable';
import { ModelController } from '../src/core/model/ModelController';

// Mock the entire module for PointerBase
jest.mock( '../src/core/interaction/PointerBase', () => {
	const actual = jest.requireActual( '../src/core/interaction/PointerBase' );
	return {
		...actual, // Keep PointerState as it is
		PointerBase: jest.fn(), // Mock the class
		BaseSettings: jest.fn(), // Mock the type/interface
	};
} );

// Mock the entire module for PointerHoldable
jest.mock( '../src/core/interaction/PointerHoldable', () => ( {
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

/**
 * TestableModelController is a minimal concrete implementation
 * of the abstract ModelController, used for testing its logic in isolation.
 */
class TestableModelController extends ModelController
{
	// Satisfy the abstract requirement with a mock
	_startEvents = jest.fn();
	_stopEvents = jest.fn();
	_getPointerPosition = jest.fn( () => ( { x: 0, y: 0 } ) );
}

// --- Test Suites ---
describe( 'ModelController Test Suite', () => {

	let mockModel: MockModel;
	let controller: TestableModelController;

	beforeEach( () => {

		// Reset mocks before each test
		mockModel = createMockModel();

		controller = new TestableModelController(
			mockModel as unknown as PointerBase | PointerHoldable,
		);

	} );

	describe( 'Initialization and State Check', () => {

		it( 'should initialize in "IDLE" state', () => {

			expect( controller._isRunning ).toBe( false );

			controller.startEvents();

			expect( controller._model.pointerTarget ).toBe( null );
			expect( controller._model._currentState ).toBe( PointerState.IDLE );
			expect( controller._isRunning ).toBe( true );
			
		} );

		it( 'should warn and return false if startEvents() is called twice', () => {

			// Spy on console.warn to ensure it's called
			const consoleWarnSpy = jest.spyOn( console, 'warn' ).mockImplementation( () => {} );

			// --- First call (the "happy path") ---
			const firstCallResult = controller.startEvents();
			expect( firstCallResult ).toBe( true );
			expect( controller._isRunning ).toBe( true );

			// --- Second call (the test for the uncovered lines) ---
			const secondCallResult = controller.startEvents();

			// Check that it returned false (Line 232)
			expect( secondCallResult ).toBe( false );

			// Check that console.warn was called (Line 231)
			expect( consoleWarnSpy ).toHaveBeenCalledWith( "PronotronPointer: Already started." );

			// Clean up the spy
			consoleWarnSpy.mockRestore();

		} );

		it( 'stopEvents() should the reset state', () => {

			controller.stopEvents();

			expect( controller._isRunning ).toBe( false );
			expect( controller._model._currentState ).toBe( PointerState.IDLE );
			expect( controller._model.pointerTarget ).toBe( null );
			
		} );
	} );

	it( 'should store the model on construction', () => {

		expect( controller._model ).toBe( mockModel );

	} );

	it( 'should delegate updateSettings to the model', () => {

		const settings: BaseSettings = {
			idleThreshold: 0.2,
			tapThreshold: 0.25,
			movingDeltaLimit: 10
		};
		controller.updateSettings( settings );
		expect( mockModel._updateSettings ).toHaveBeenCalledWith( settings );

	} );

	it( 'should get the correct state string from the model', () => {

		mockModel._currentState = PointerState.MOVING;
		expect( controller.getState() ).toBe( 'MOVING' );

		mockModel._currentState = PointerState.IDLE;
		expect( controller.getState() ).toBe( 'IDLE' );

	} );

	it( 'should get the correct canInteract value from the model', () => {

		mockModel._canInteract = true;
		expect( controller.canInteract() ).toBe( true );

		mockModel._canInteract = false;
		expect( controller.canInteract() ).toBe( false );

	} );

	it( 'should get the pointerStart position from the model', () => {

		expect( controller.getPosition() ).toBe( mockModel._pointerStart );

	} );

	it( 'should get the pointerDelta from the model', () => {

		expect( controller.getDelta() ).toBe( mockModel._pointerDelta );
		expect( controller.getDelta() ).toEqual( { x: 1, y: 2 } );

	} );

	it( 'should get the pointerDeltaAdditive from the model', () => {

		expect( controller.getDeltaAdditive() ).toBe( mockModel._pointerDeltaAdditive );
		expect( controller.getDeltaAdditive() ).toEqual( { x: 520, y: 150 } );

	} );

} );