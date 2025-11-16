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

// Define a type for our mock model for better intellisense
type MockModel = ReturnType<typeof createMockModel>;

/**
 * TestableModelController is a minimal concrete implementation
 * of the abstract ModelController, used for testing its logic in isolation.
 */
class TestableModelController extends ModelController
{
	// Satisfy the abstract requirement with a mock
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