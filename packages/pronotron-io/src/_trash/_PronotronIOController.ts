import throttle from "lodash.throttle";
import { 
	IONode, 
	IOEvent,
	IODispatchFunction,
	IOElementsTable, 
	ViewportProps, 
	ControlGroupsTable 
} from "../../types/global";

export { throttle };

export class PronotronIOController 
{
    private static instance: PronotronIOEngine;

    private constructor(){}

    public static getInstance(): PronotronIOEngine {
        if ( ! PronotronIOController.instance ){
            PronotronIOController.instance = new PronotronIOEngine();
        }
        return PronotronIOController.instance;
    }
}

class PronotronIO
{
	_nodes: ( IONode | null )[] = [];

	_ioElementsTable: IOElementsTable = {
		_yPositions: [],
		_possibleEvents: []
	};
	_controlGroupsTable: ControlGroupsTable = {
		"top-out": [], // Scroll down
		"bottom-in": [], // Scroll down
		"top-in": [], // Scroll up
		"bottom-out": [], // Scroll up
	};

	_viewport = {
		_screenHeight: 0,
		_totalPageHeight: 0,
		_totalPossibleScroll: 0, // _totalPageHeight - _screenHeight
	};
	
	addNode( newNode: IONode ): void
	{
		if ( ! this._nodes.some( node => node?.ref === newNode.ref ) ){
			this._nodes.push( newNode );
			//this.generateControlGroup( newNode, this._nodes.length - 1 );

		} else {
			console.warn( `Node is already in the list.`, newNode.ref );
		}

		console.log( this._nodes );
		console.log( this._ioElementsTable );
	}

	removeNode( existingNode: Element ): void
	{	
		const nodeIndex = this._nodes.findIndex( node => node?.ref === existingNode );

		if ( nodeIndex < 0 ){
			console.warn( `Node is not found in the list.`, existingNode );
		} else {
			/**
			 * CHATGPT:
			 * Removing node will be create INDEX bug
			 * 
			 * When a _node removed, _ioElementsTable needs to be rebuilded since it is a row of _nodex index data
			 */
			this._nodes[ nodeIndex ] = null;
			this.updateControlGroups( nodeIndex, [ "top-in", "top-out", "bottom-in", "bottom-out" ], [] );
			//this.cleanNodes();
		}
	}

	cleanNodes_(): void
	{
		/**
		 * Cleans empty nodes
		 * 
		 * @bug
		 * Cleaning a node changes remaining node indices,
		 * _controlGroupsTable have to be updated.
		 */
		this._nodes = this._nodes.filter( node => node );
		this._ioElementsTable._possibleEvents = this._ioElementsTable._possibleEvents.filter( events => events );
		this._ioElementsTable._yPositions = this._ioElementsTable._yPositions.filter( events => events );
	}

	setViewport( viewport: ViewportProps ): void
	{
		this._viewport = {
			_screenHeight: viewport.screenHeight,
			_totalPageHeight: viewport.totalPageHeight,
			_totalPossibleScroll: viewport.totalPageHeight - viewport.screenHeight
		};
		this.generateControlGroups();
	}

	/**
	 * Resets control groups on initialization and onResize.
	 * On initialization only "top-out" and "bottom-in" events are possible.
	 */
	generateControlGroups(): void
	{
		this._controlGroupsTable = {
			"top-in": [],
			"top-out": [],
			"bottom-in": [],
			"bottom-out": [],
		};

		this._nodes.forEach(( element, index ) => {

			// Element might be null
			if ( ! element ) return;

			this.generateControlGroup( element, index );

		} );
	}

	protected generateControlGroup( element: IONode, index: number ): void
	{
		const elementY = element.getYPosition();
		const possibleEvents = this.#calculatePossibleEvents( elementY );
		
		this._ioElementsTable._possibleEvents[ index ] = possibleEvents;
		this._ioElementsTable._yPositions[ index ] = elementY;

		/**
		 * #performance-tradeoff
		 * 
		 * We can't filter events, defined events only on dom element because,
		 * When an element "top-out", we need track "top-in" back in handleIntersection() to activate "top-out" back
		 */
		// const possibleEvents = ( Object.keys( element.pronotron ) as Statuses[] ).filter( value => possibleEvents.includes( value ) );

		/**
		 * Create initial control groups with NO SCROLL.
		 * Only "top-out" and "bottom-in" are possible.
		 */
		if ( elementY < this._viewport._screenHeight ){
			this._controlGroupsTable[ "top-out" ].push( index );
		} else {
			this._controlGroupsTable[ "bottom-in" ].push( index );
		}
	}

	/**
	 * Add and/or delete node in multiple control groups
	 * 
	 * @param elementID Index of the node in ioElementsTable 
	 * @param oldEvents Events to remove
	 * @param newEvents Events to add
	 */
	protected updateControlGroups( elementID: number, oldEvents: IOEvent[], newEvents: IOEvent[] ): void 
	{
		// Remove the element from all given groups
		for ( const event of oldEvents ){
			this._controlGroupsTable[ event ] = this._controlGroupsTable[ event ].filter( id => id != elementID );
		}

		// Add the element to new groups
		for ( const newEvent of newEvents ){
			// If it doesn't exist, push the element
			if ( ! this._controlGroupsTable[ newEvent ].some( id => id == elementID ) ){
				this._controlGroupsTable[ newEvent ].push( elementID );
			}
		}

		// console.log({ 
		// 	"top-in": this._controlGroupsTable[ "top-in" ],
		// 	"top-out": this._controlGroupsTable[ "top-out" ],
		// 	"bottom-in": this._controlGroupsTable[ "bottom-in" ],
		// 	"bottom-out": this._controlGroupsTable[ "bottom-out" ],
		// });
	}

	/**
	 * Calculates possible events on initialization, that is NOT relative to current scroll.
	 * Helps to avoid adding elements to unneccessery control groups.
	 * 
	 * @param elementY Element initial Y position
	 */
	#calculatePossibleEvents( elementY: number ): IOEvent[]
	{
		const possibleEvents: IOEvent[] = [];
		
		if ( elementY < this._viewport._screenHeight ){
			/**
			 * Element position is smaller than screen height.
			 * Element can only "top-out" and "top-in".
			 */
			if ( elementY > this._viewport._totalPossibleScroll ){
				/**
				 * Element Y position is bigger than totalPossibleScroll. Element can't dispatch any event.
				 */
				console.warn( "Element can't dispatch any event" );
				return [];
			} else {
				possibleEvents.push( "top-out", "top-in" );
			}
		} else {
			/**
			 * Element position is bigger than screen height.
			 * Element can "bottom-in" and "bottom-out"
			 */
			possibleEvents.push( "bottom-in", "bottom-out" );

			// Is totalPossibleScroll is enough to element can "top-out"?
			const canTopOut = elementY < this._viewport._totalPossibleScroll;

			if ( canTopOut ){
				possibleEvents.push( "top-in", "top-out" );
			}
		}

		return possibleEvents;
	}

}




class PronotronIOEngine extends PronotronIO
{
	// Start at 0 even with a jumpy start value, to run handleScroll correctly
	_lastScrollY = 0;
	direction: "up" | "down" = "down";

	handleResize( viewport: ViewportProps ): void 
	{
		// OnResize reset the _lastScrollY to able handleScroll() run correctly
		this._lastScrollY = 0;

		// Viewport should be passed externally, every app might have a different logic (Eg: transform 3D scroll apps)
		this.setViewport( viewport );
		
		this.generateControlGroups();
		//console.log( "Logic rebuilded.", this._ioElementsTable, this.controlGroup );
	}

	handleScroll( scrollY: number ): void 
	{
		// Skips initial run for scroll value = 0
		if ( scrollY == this._lastScrollY ) return;

		if ( scrollY > this._lastScrollY ){
			this.direction = "down";
			this.#handleScrollDown( scrollY, this._viewport._screenHeight );
		} else {
			this.direction = "up";
			this.#handleScrollUp( scrollY, this._viewport._screenHeight );
		}

		this._lastScrollY = scrollY;
	}

	/**
	 * User is SCROLLING DOWN.
	 * Only "top-out" and "bottom-in" events are possible.

	 * @param scrollY Current scrollY value (window.scrollY) to calculate top (scrollY)
	 * @param viewportHeight Current viewportHeight to calculate bottom (scrollY + viewportHeight)
	 */
	#handleScrollDown( scrollY: number, viewportHeight: number ): void 
	{
		/**
		 * @important
		 * Check "bottom-in" first:
		 * Initial scrollY might be a jumpy value to make an element first "bottom-in" then "top-out".
		 * 
		 * @important
		 * We need to iterate over the _controlGroupsTable in reverse order. 
		 * This way, removing elements won't affect the indices of the yet-to-be-processed elements.
		 */
		for ( let i = this._controlGroupsTable[ "bottom-in" ].length - 1; i >= 0; i-- ){

			const elementID = this._controlGroupsTable[ "bottom-in" ][ i ];
			const elementY = this._ioElementsTable._yPositions[ elementID ];

			if ( elementY < ( scrollY + viewportHeight ) ){

				const elementNode = this._nodes[ elementID ];
				const elementPossibleEvents = this._ioElementsTable._possibleEvents[ elementID ];

				/**
				 * - Delete element in "bottom-in", 
				 * - Add to "top-out" and/or "bottom-out" if possible
				 */
				const possibleEvents = ([ "top-out", "bottom-out" ] as IOEvent[]).filter( value => elementPossibleEvents.includes( value ) );
				this.updateControlGroups( elementID, [ "bottom-in" ], possibleEvents );
				this.#dispatchEvent( elementNode!, "bottom-in" );
			}

		}

		/**
		 * @important
		 * We need to iterate over the _controlGroupsTable in reverse order. 
		 * This way, removing elements won't affect the indices of the yet-to-be-processed elements.
		 */
		for ( let i = this._controlGroupsTable[ "top-out" ].length - 1; i >= 0; i-- ){

			const elementID = this._controlGroupsTable[ "top-out" ][ i ];
			const elementY = this._ioElementsTable._yPositions[ elementID ];

			if ( elementY < scrollY ){

				const elementNode = this._nodes[ elementID ];
				const elementPossibleEvents = this._ioElementsTable._possibleEvents[ elementID ];
				/**
				 * - Delete element in "top-out" and/or "bottom-out".
				 * - Add to "top-in" if possible.
				 */
				const possibleEvents = ([ "top-in" ] as IOEvent[]).filter( value => elementPossibleEvents.includes( value ) );
				this.updateControlGroups( elementID, [ "top-out", "bottom-out" ], possibleEvents );
				this.#dispatchEvent( elementNode!, "top-out" );			
			}

		}
	}

	/**
	 * User is SCROLLING UP.
	 * Only "top-in" and "bottom-out" are possible.
	 * 
	 * @param scrollY Current scrollY value (window.scrollY) to calculate top (scrollY)
	 * @param viewportHeight Current viewportHeight to calculate bottom (scrollY + viewportHeight)
	 */
	#handleScrollUp( scrollY: number, viewportHeight: number ): void
	{
		/**
		 * @important
		 * Check "top-in" first:
		 * Instant changes on scrollY might be a big value to 
		 * make an element "top-in" first then "bottom-out".
		 * 
		 * @important
		 * We need to iterate over the _controlGroupsTable in reverse order. 
		 * This way, removing elements won't affect the indices of the yet-to-be-processed elements.
		 */
		for ( let i = this._controlGroupsTable[ "top-in" ].length - 1; i >= 0; i-- ){

			const elementID = this._controlGroupsTable[ "top-in" ][ i ];
			const elementY = this._ioElementsTable._yPositions[ elementID ];

			if ( elementY > scrollY ){

				const elementNode = this._nodes[ elementID ];
				const elementPossibleEvents = this._ioElementsTable._possibleEvents[ elementID ];
				/**
				 * - Delete element in "top-in".
				 * - Add to "top-out" and/or "bottom-out" if possible.
				 */
				const possibleEvents = ([ "top-out", "bottom-out" ] as IOEvent[]).filter( value => elementPossibleEvents.includes( value ) );
				this.updateControlGroups( elementID, [ "top-in" ], possibleEvents );
				this.#dispatchEvent( elementNode!, "top-in" );			
			}

		}

		/**
		 * @important
		 * We need to iterate over the _controlGroupsTable in reverse order. 
		 * This way, removing elements won't affect the indices of the yet-to-be-processed elements.
		 */
		for ( let i = this._controlGroupsTable[ "bottom-out" ].length - 1; i >= 0; i-- ){

			const elementID = this._controlGroupsTable[ "bottom-out" ][ i ];
			const elementY = this._ioElementsTable._yPositions[ elementID ];

			if ( elementY > ( scrollY + viewportHeight ) ){

				const elementNode = this._nodes[ elementID ];
				const elementPossibleEvents = this._ioElementsTable._possibleEvents[ elementID ];
				/**
				 * - Delete element in "bottom-out", "top-out"
				 * - Add to "bottom-in" if possible.
				 */
				const possibleEvents = ([ "bottom-in" ] as IOEvent[]).filter( value => elementPossibleEvents.includes( value ) );
				this.updateControlGroups( elementID, [ "bottom-out", "top-out" ], possibleEvents );
				this.#dispatchEvent( elementNode!, "bottom-out" );			
			}

		}
	}

	#dispatchEvent( ioNode: IONode, event: IOEvent )
	{
		if ( ( ioNode.dispatch as Partial<IODispatchFunction> )[ event ] ) {
			( ioNode.dispatch as Partial<IODispatchFunction> )[ event ]!();
		} else {
			return;
		}

		if ( "retry" in ioNode.dispatch ){
			ioNode.dispatch.retry -= 1;
			if ( ioNode.dispatch.retry < 1 ){
				this.removeNode( ioNode.ref );
			}
		}
	}

}