import { EventUtils } from '../../src/core/helpers/EventUtils'; // Adjust path as needed

// Define a type for the string events for our testable class
type TestEvents = 'my:start' | 'my:end';

/**
 * A minimal, concrete implementation of the abstract EventUtils class
 * specifically for testing.
 */
class TestableEventUtils extends EventUtils<TestEvents>
{
	// We make _target public so we can assign our mock to it
	public _target: HTMLElement;

	constructor( mockTarget: HTMLElement ) {
		super();
		this._target = mockTarget;
	}
}

describe( 'EventUtils', () => {

	let controller: TestableEventUtils;
	let mockTarget: HTMLElement;
	let mockListener: jest.Mock;
	let mockListener2: jest.Mock;

	beforeEach( () => {

		// Reset mocks before each test
		jest.clearAllMocks();

		// Create a mock HTMLElement with spyable methods
		mockTarget = {
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
			dispatchEvent: jest.fn(),
		} as unknown as HTMLElement; // Cast to satisfy TypeScript

		// Create mock listener functions
		mockListener = jest.fn();
		mockListener2 = jest.fn();

		// Instantiate our testable class with the mock target
		controller = new TestableEventUtils( mockTarget );

	} );


	// --- _addEventListeners ---
	describe( '_addEventListeners', () => {

		it( 'should add a single event listener with default options', () => {

			controller._addEventListeners( [ 'click', mockListener ] );

			expect( mockTarget.addEventListener ).toHaveBeenCalledTimes( 1 );
			// Verifies that the default { passive: false } is added
			expect( mockTarget.addEventListener ).toHaveBeenCalledWith(
				'click',
				mockListener,
				{ passive: false },
			);

		} );

		it( 'should add multiple event listeners with default options', () => {

			controller._addEventListeners(
				[ 'click', mockListener ],
				[ 'mouseover', mockListener2 ],
			);

			expect( mockTarget.addEventListener ).toHaveBeenCalledTimes( 2 );
			expect( mockTarget.addEventListener ).toHaveBeenCalledWith(
				'click',
				mockListener,
				{ passive: false },
			);
			expect( mockTarget.addEventListener ).toHaveBeenCalledWith(
				'mouseover',
				mockListener2,
				{ passive: false },
			);
			
		} );

		it( 'should respect custom event listener options when provided', () => {

			const customOptions = { passive: true, capture: true };
			controller._addEventListeners( [ 'scroll', mockListener, customOptions ] );

			expect( mockTarget.addEventListener ).toHaveBeenCalledTimes( 1 );
			expect( mockTarget.addEventListener ).toHaveBeenCalledWith(
				'scroll',
				mockListener,
				customOptions,
			);

		} );

		it( 'should handle a mix of default and custom options', () => {
			const customOptions = { once: true };
			controller._addEventListeners(
				[ 'pointerdown', mockListener ], // Default
				[ 'pointerup', mockListener2, customOptions ], // Custom
			);

			expect( mockTarget.addEventListener ).toHaveBeenCalledTimes( 2 );
			expect( mockTarget.addEventListener ).toHaveBeenCalledWith(
				'pointerdown',
				mockListener,
				{ passive: false },
			);
			expect( mockTarget.addEventListener ).toHaveBeenCalledWith(
				'pointerup',
				mockListener2,
				customOptions,
			);
		} );

		it( 'should not call addEventListener if no events are provided', () => {
			controller._addEventListeners();
			expect( mockTarget.addEventListener ).not.toHaveBeenCalled();
		} );
	} );


	// --- _removeEventListeners ---
	describe( '_removeEventListeners', () => {
		it( 'should remove a single event listener', () => {
			controller._removeEventListeners( [ 'click', mockListener ] );

			expect( mockTarget.removeEventListener ).toHaveBeenCalledTimes( 1 );
			expect( mockTarget.removeEventListener ).toHaveBeenCalledWith(
				'click',
				mockListener,
			);
		} );

		it( 'should remove multiple event listeners', () => {
			controller._removeEventListeners(
				[ 'click', mockListener ],
				[ 'mouseover', mockListener2 ],
			);

			expect( mockTarget.removeEventListener ).toHaveBeenCalledTimes( 2 );
			expect( mockTarget.removeEventListener ).toHaveBeenCalledWith(
				'click',
				mockListener,
			);
			expect( mockTarget.removeEventListener ).toHaveBeenCalledWith(
				'mouseover',
				mockListener2,
			);
		} );

		it( 'should not call removeEventListener if no events are provided', () => {
			controller._removeEventListeners();
			expect( mockTarget.removeEventListener ).not.toHaveBeenCalled();
		} );
	} );

	// --- _dispatchCustomEvent ---
	describe( '_dispatchCustomEvent', () => {

		it( 'should dispatch a CustomEvent with the correct name and detail', () => {

			const eventName: TestEvents = 'my:start';
			const detailPayload = {
				foo: 'bar',
				position: { x: 100, y: 200 },
			};

			controller._dispatchCustomEvent( eventName, detailPayload );

			// 2. Check that the dispatch method was called on the target
			expect( mockTarget.dispatchEvent ).toHaveBeenCalledTimes( 1 );

			// 3. Check that the *actual event instance* was passed to dispatchEvent
			// This is the most robust check.
			const dispatchedEvent = ( mockTarget.dispatchEvent as jest.Mock ).mock.calls[ 0 ][ 0 ];

			expect( dispatchedEvent ).toBeInstanceOf( CustomEvent );
			expect( dispatchedEvent.type ).toBe( eventName );
			expect( dispatchedEvent.detail ).toBe( detailPayload ); // Check reference
			expect( dispatchedEvent.detail ).toEqual( {
				foo: 'bar',
				position: { x: 100, y: 200 },
			} );

		} );

		it( 'should handle an empty detail object', () => {

			const eventName: TestEvents = 'my:end';
			const detailPayload = {};

			controller._dispatchCustomEvent( eventName, detailPayload );

			expect( mockTarget.dispatchEvent ).toHaveBeenCalledTimes( 1 );
			const dispatchedEvent = ( mockTarget.dispatchEvent as jest.Mock ).mock.calls[ 0 ][ 0 ];

			expect( dispatchedEvent.type ).toBe( eventName );
			expect( dispatchedEvent.detail ).toBe( detailPayload );
			expect( dispatchedEvent.detail ).toEqual( {} );
			
		} );
	} );
} );