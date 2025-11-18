import { EventUtils } from '../../src/core/helpers/EventUtils';

/**
 * A minimal, concrete implementation of the **abstract** EventUtils class
 * specifically for testing.
 */
class TestableEventUtils extends EventUtils<'custom-event:1' | 'custom-event:2'>
{
	// We make _target public so we can assign our mock to it
	public _target: HTMLElement;

	constructor( mockTarget: HTMLElement ) {
		super();
		this._target = mockTarget;
	}
}

describe( 'EventUtils Test Suite', () => {

	let controller: TestableEventUtils;
	let mockTarget: HTMLElement;
	let mockListener: jest.Mock;
	let mockListener2: jest.Mock;

	beforeEach( () => {

		// Reset mocks before each test
		jest.clearAllMocks();
		jest.restoreAllMocks();

		mockTarget = document.body;

		// Create mock listener functions
		mockListener = jest.fn();
		mockListener2 = jest.fn();

		// Instantiate our testable class with the mock target
		controller = new TestableEventUtils( mockTarget );

		jest.spyOn( mockTarget, 'dispatchEvent' );
		jest.spyOn( mockTarget, 'addEventListener' );
		jest.spyOn( mockTarget, 'removeEventListener' );

	} );

	describe( 'test addEventListeners()', () => {

		it( 'should add a single event listener with default options', () => {

			controller._addEventListeners( [ 'click', mockListener ] );

			expect( mockTarget.addEventListener ).toHaveBeenCalledTimes( 1 );

			// Verifies that the default { passive: false } is added
			expect( mockTarget.addEventListener ).toHaveBeenCalledWith( 'click', mockListener, { passive: false } );

		} );

		it( 'should add multiple event listeners with default options', () => {

			controller._addEventListeners(
				[ 'click', mockListener ],
				[ 'mouseover', mockListener2 ],
			);

			expect( mockTarget.addEventListener ).toHaveBeenCalledTimes( 2 );
			expect( mockTarget.addEventListener ).toHaveBeenCalledWith( 'click', mockListener, { passive: false } );
			expect( mockTarget.addEventListener ).toHaveBeenCalledWith( 'mouseover', mockListener2, { passive: false } );
			
		} );

		it( 'should respect custom event listener options when provided', () => {

			const customOptions = { passive: true, capture: true };
			controller._addEventListeners( [ 'scroll', mockListener, customOptions ] );

			expect( mockTarget.addEventListener ).toHaveBeenCalledTimes( 1 );
			expect( mockTarget.addEventListener ).toHaveBeenCalledWith( 'scroll', mockListener, customOptions );

		} );

		it( 'should handle a mix of default and custom options', () => {

			const customOptions = { once: true };
			controller._addEventListeners(
				[ 'pointerdown', mockListener ],
				[ 'pointerup', mockListener2, customOptions ],
			);

			expect( mockTarget.addEventListener ).toHaveBeenCalledTimes( 2 );
			expect( mockTarget.addEventListener ).toHaveBeenCalledWith( 'pointerdown', mockListener, { passive: false } );
			expect( mockTarget.addEventListener ).toHaveBeenCalledWith( 'pointerup', mockListener2, customOptions );

		} );

		it( 'should not call addEventListener() if no events are provided', () => {

			controller._addEventListeners();
			expect( mockTarget.addEventListener ).not.toHaveBeenCalled();

		} );

	} );


	describe( 'test removeEventListeners()', () => {

		it( 'should remove a single event listener', () => {

			controller._removeEventListeners( [ 'click', mockListener ] );

			expect( mockTarget.removeEventListener ).toHaveBeenCalledTimes( 1 );
			expect( mockTarget.removeEventListener ).toHaveBeenCalledWith( 'click', mockListener );

		} );

		it( 'should remove multiple event listeners', () => {

			controller._removeEventListeners(
				[ 'click', mockListener ],
				[ 'mouseover', mockListener2 ],
			);

			expect( mockTarget.removeEventListener ).toHaveBeenCalledTimes( 2 );
			expect( mockTarget.removeEventListener ).toHaveBeenCalledWith( 'click', mockListener );
			expect( mockTarget.removeEventListener ).toHaveBeenCalledWith( 'mouseover', mockListener2 );

		} );

		it( 'should not call removeEventListener if no events are provided', () => {

			controller._removeEventListeners();
			expect( mockTarget.removeEventListener ).not.toHaveBeenCalled();

		} );

	} );


	describe( 'test dispatchCustomEvent()', () => {

		it( 'should dispatch a CustomEvent with the correct name and detail', () => {

			const detailPayload = {
				foo: 'bar',
				position: { x: 100, y: 200 },
			};

			controller._dispatchCustomEvent( 'custom-event:1', detailPayload );

			// 2. Check that the dispatch method was called on the target
			expect( mockTarget.dispatchEvent ).toHaveBeenCalledTimes( 1 );

			// 3. Check that the *actual event instance* was passed to dispatchEvent
			// This is the most robust check.
			const dispatchedEvent = jest.mocked( mockTarget.dispatchEvent ).mock.lastCall![ 0 ] as CustomEvent;

			expect( dispatchedEvent ).toBeInstanceOf( CustomEvent );
			expect( dispatchedEvent.type ).toBe( 'custom-event:1' );
			expect( dispatchedEvent.detail ).toBe( detailPayload ); // Check reference
			expect( dispatchedEvent.detail ).toEqual( {
				foo: 'bar',
				position: { x: 100, y: 200 },
			} );

		} );

		it( 'should handle an empty detail object', () => {

			const detailPayload = {};

			controller._dispatchCustomEvent( 'custom-event:2', detailPayload );

			expect( mockTarget.dispatchEvent ).toHaveBeenCalledTimes( 1 );
			const dispatchedEvent = jest.mocked( mockTarget.dispatchEvent ).mock.lastCall![ 0 ] as CustomEvent;

			expect( dispatchedEvent.type ).toBe( 'custom-event:2' );
			expect( dispatchedEvent.detail ).toBe( detailPayload );
			expect( dispatchedEvent.detail ).toEqual( {} );
			
		} );

	} );

} );