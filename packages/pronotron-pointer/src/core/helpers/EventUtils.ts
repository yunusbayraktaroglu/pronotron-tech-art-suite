type CustomEventDetail = {
	target: HTMLElement | null;
	endTarget?: HTMLElement | null;
	position: { 
		x: number; 
		y: number;
	};
};

/**
 * Helps to trigger {@link CustomEvent} with inferred event names.
 */
export abstract class EventUtils<TEvent extends string> 
{
	abstract _target: HTMLElement | Window | Document;

	/**
	 * Add event listeners as list to target
	 * 
	 * @param events List of events to add target
	 * @internal
	 */
	_addEventListeners<E extends Event>( ...events: [ keyof GlobalEventHandlersEventMap, ( event: E ) => void, AddEventListenerOptions? ][] ): void 
	{
		events.forEach(([ eventKey, listener, options ]) => {
			this._target.addEventListener( eventKey, listener as EventListener, options ?? { passive: false } );
		});
	}

	/**
	 * Remove events from target
	 * 
	 * @param events List of events to remove from target
	 * @internal
	 */
	_removeEventListeners<E extends Event>( ...events: [ keyof GlobalEventHandlersEventMap, ( event: E ) => void ][] ): void 
	{
		events.forEach(([ eventKey, listener ]) => {
			this._target.removeEventListener( eventKey, listener as EventListener );
		});
	}

	/**
	 * Dispatches a possible custom event with detail object
	 * 
	 * @param customEvent One of possible custom events
	 * @param detail Custom event detail
	 * @internal
	 */
	_dispatchCustomEvent( customEvent: TEvent, detail: Object ): void
	{
		this._target.dispatchEvent( new CustomEvent( customEvent, { detail } ) );
	}
}