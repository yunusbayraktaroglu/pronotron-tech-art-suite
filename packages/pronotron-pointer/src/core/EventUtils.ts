export class EventUtils<T extends string> 
{
	private _target: HTMLElement | Window | Document;

	constructor( target: HTMLElement | Window | Document ){
		this._target = target;
	}

	/**
	 * Add event listeners as list to target
	 * @param events List of events to add target
	 * @internal
	 */
	protected _addEventListeners<E extends Event>( ...events: [ keyof GlobalEventHandlersEventMap, ( event: E ) => void ][] ): void 
	{
		events.forEach(([ eventKey, listener ]) => {
			this._target.addEventListener( eventKey, listener as EventListener );
		});
	}

	/**
	 * Remove events from target
	 * @param events List of events to remove from target
	 * @internal
	 */
	protected _removeEventListeners<E extends Event>( ...events: [ keyof GlobalEventHandlersEventMap, ( event: E ) => void ][] ): void 
	{
		events.forEach(([ eventKey, listener ]) => {
			this._target.removeEventListener( eventKey, listener as EventListener );
		});
	}

	/**
	 * Dispatches a possible custom event with detail object
	 * @param customEvent One of possible custom events
	 * @param detail Custom event detail
	 * @internal
	 */
	protected _dispatchCustomEvent( customEvent: T, detail: { [ key: string ]: any } ): void
	{
		this._target.dispatchEvent( new CustomEvent( customEvent, { detail } ) );
	}
}