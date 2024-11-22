export abstract class EventUtils<T extends string> 
{
	abstract _target: HTMLElement | Window | Document;

	/**
	 * Add event listeners as list to target
	 * 
	 * @param events List of events to add target
	 * @internal
	 */
	_addEventListeners<E extends Event>( ...events: [ keyof GlobalEventHandlersEventMap, ( event: E ) => void ][] ): void 
	{
		events.forEach(([ eventKey, listener ]) => {
			this._target.addEventListener( eventKey, listener as EventListener, { passive: false } );
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
	_dispatchCustomEvent( customEvent: T, detail: Object ): void
	{
		this._target.dispatchEvent( new CustomEvent( customEvent, { detail } ) );
	}
}