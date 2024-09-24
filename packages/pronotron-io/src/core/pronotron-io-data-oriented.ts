/**
 * Intersection Observer API might miss some elements on fast scroll.
 * That custom class designed to not miss any intersection.
 * 
 * Designed to using in 1px height element
 * 
 * Data oriented JS
 * @see https://archive.fosdem.org/2024/events/attachments/fosdem-2024-2773-fast-javascript-with-data-oriented-design/slides/22662/Fast_JavaScript_with_Data-oriented_Design_NSQS2z4.pdf
 */

import throttle from "lodash.throttle";
import { ViewportHelper } from "./screen/screen-helper";




/**
 * Possible events of an element
 */
type Event = "top-in" | "top-out" | "bottom-in" | "bottom-out";

/**
 * Related data passed into DOM elements "pronotron" property
 */
type IODomElement = Element & {
	pronotron: Partial<Record<Event, {
		retry?: number;
		payload: () => void;
	}>>;
};


/**
 * IOElementsTable.nodes index value
 */
type ControlGroup = {
	"top-in": number[];
	"top-out": number[];
	"bottom-in": number[];
	"bottom-out": number[];
};

/**
 * Properties for each HTML node to follow data-oriented design
 */
type IOElementsTable = {
	/**
	 * Y position of element, that is NOT relative to viewport
	 */
	_nodes: IODomElement[];
	_yPositions: number[];
	_possibleEvents: Event[][];
};



/**
 * Plugout logic might be improved
 * 
 * if "bottom-out" is finished
 * 
 * 
 */
export class ViewportTrackerDataOriented
{
	private pageHelper = new ViewportHelper();
	private controlGroup: ControlGroup = {
		"top-in": [],
		"top-out": [],
		"bottom-in": [],
		"bottom-out": [],
	};
	private _ioElementsTable: IOElementsTable = {
		_yPositions: [],
		_possibleEvents: [],
		_nodes: [],
	};
	private currentY = 0;
	private handleScrollBound: () => void;
	private handleResizeBound: () => void;

    constructor( scrollMS: number = 250, resizeMS: number = 1000 )
	{
		/**
		 * Leading-only (leading: true, trailing: false): The function is called at the start of the interval but ignores any events 
		 * during or after the interval until it resets. Useful when you want instant feedback but no follow-up actions.
		 * 
		 * Trailing-only (leading: false, trailing: true): In this case, the function waits until the interval ends to execute the latest event.
		 * It effectively delays execution, acting like a debounce but with controlled spacing between invocations.
		 */
		this._ioElementsTable._nodes = Array.from( document.querySelectorAll( '[data-pronotron-io]' ) );
		this.handleScrollBound = throttle( this.handleScroll.bind( this ), scrollMS, { leading: false, trailing: true } );
		this.handleResizeBound = throttle( this.handleResize.bind( this ), resizeMS, { leading: false, trailing: true } );
        this.init();
    }

    private init(): void 
	{
		window.addEventListener( 'scroll', this.handleScrollBound );
		window.addEventListener( 'resize', this.handleResizeBound );
        this.handleResize();
    }

	private handleResize(): void 
	{
		// While resize reset currentY, to able handleIntersection() run correctly
		this.currentY = 0;
		this.pageHelper.calculate();
		this.createControlGroup();
		this.handleScroll();
		//console.log( "Logic rebuilded.", this._ioElementsTable, this.controlGroup );
	}

	private handleScroll(): void
	{
		this.handleIntersection();
		this.currentY = window.scrollY;
	}

	/**
	 * Generates control group on initialization and resize.
	 * On initialization only "top-out" and "bottom-in" events are possible.
	 */
	private createControlGroup(): void
	{
		// Only for getting initial Y position of the element
		const currentY = window.scrollY;

		// Reset controlGroup
		this.controlGroup = {
			"top-in": [],
			"top-out": [],
			"bottom-in": [],
			"bottom-out": [],
		};

		this._ioElementsTable._nodes.forEach(( element, index ) => {

			const elementY = element.getBoundingClientRect().top + currentY;
			const possibleEvents = this.calculatePossibleEvents( elementY );
			
			this._ioElementsTable._possibleEvents[ index ] = possibleEvents;
			this._ioElementsTable._yPositions[ index ] = elementY;

			/**
			 * #performance-tradeoff
			 * 
			 * We can't filter events, defined events only on dom element because,
			 * When an element "top-out", we need track back "top-in" in handleIntersection() to activate back "top-out"
			 */
			// const possibleEvents = ( Object.keys( element.pronotron ) as Statuses[] ).filter( value => possibleEvents.includes( value ) );

			/**
			 * Create initial control groups with NO SCROLL.
			 * Only "top-out" and "bottom-in" are possible.
			 */
			if ( elementY < this.pageHelper._screenHeight ){
				this.controlGroup[ "top-out" ].push( index );
			} else {
				this.controlGroup[ "bottom-in" ].push( index );
			}

		} );
	}

	/**
	 * Calculates possible events on init that is NOT relative to current scroll.
	 * Helps to avoid adding elements to unneccessery control groups.
	 * 
	 * @param elementY Element initial Y position
	 */
	private calculatePossibleEvents( elementY: number ): Event[]
	{
		const possibleEvents: Event[] = [];
		
		if ( elementY < this.pageHelper._screenHeight ){
			/**
			 * Element position is smaller than screen height.
			 * Element can only "top-out" and "top-in".
			 */
			if ( elementY > this.pageHelper._totalPossibleScroll ){
				/**
				 * Element position is bigger than max scroll. It's an error.
				 */
				console.warn( "Element can't dispatch any event" );
			} else {
				possibleEvents.push( "top-out", "top-in" );
			}
		} else {
			/**
			 * Element position is bigger than screen height.
			 * Element can only "bottom-in" and "bottom-out"
			 */
			possibleEvents.push( "bottom-in", "bottom-out" );

			// If element can "top-out"
			const canTopOut = elementY < this.pageHelper._totalPossibleScroll;

			if ( canTopOut ){
				possibleEvents.push( "top-in", "top-out" );
			}
		}

		return possibleEvents;
	}


	private plugoutElement( elementID: number ): void
	{
		this.updateControlGroups( elementID, [ "top-in", "top-out", "bottom-in", "bottom-out" ], [] );
	}


	private executeElementFunction( element: IODomElement, event: Event ): void
	{
		// see #performance-tradeoff
		if ( element.pronotron[ event ] ){

			element.pronotron[ event ].payload();

			if ( element.pronotron[ event ].retry ){

				element.pronotron[ event ].retry -= 1;

				if ( element.pronotron[ event ].retry < 1 ){
					element.pronotron[ event ] = undefined;
					// console.log( "plugout" );
					// this.plugoutElement( element );
				}
			}

		}
	}


    private handleIntersection(): void 
	{
		const currentY = window.scrollY;

		// Skip initial run for scroll value = 0
		if ( currentY == this.currentY ) return;

		if ( currentY > this.currentY ){

			/**
			 * User SCROLLING DOWN
			 * Only "top-out" and "bottom-in" are possible
			 * 
			 * @important
			 * Check "bottom-in" first:
			 * Initial scrollY might be a big value to 
			 * make an element "bottom-in" first then "top-out".
			 * 
			 * @important
			 * We need to iterate over the controlGroup in reverse order. 
			 * This way, removing elements won't affect the indices of the yet-to-be-processed elements.
			 */
			for ( let i = this.controlGroup[ "bottom-in" ].length - 1; i >= 0; i-- ){

				const elementID = this.controlGroup[ "bottom-in" ][ i ];
				const elementY = this._ioElementsTable._yPositions[ elementID ];

				if ( elementY < ( currentY + this.pageHelper._screenHeight ) ){
					const element = this._ioElementsTable._nodes[ elementID ];
					const elementPossibleEvents = this._ioElementsTable._possibleEvents[ elementID ];
					/**
					 * - Delete element in "bottom-in", 
					 * - Add to "top-out" and/or "bottom-out" if possible
					 */
					const possibleEvents = ([ "top-out", "bottom-out" ] as Event[]).filter( value => elementPossibleEvents.includes( value ) );
					this.updateControlGroups( elementID, [ "bottom-in" ], possibleEvents );
					this.executeElementFunction( element, "bottom-in" );
					
				}

			}

			/**
			 * @important
			 * We need to iterate over the controlGroup in reverse order. 
			 * This way, removing elements won't affect the indices of the yet-to-be-processed elements.
			 */
			for ( let i = this.controlGroup[ "top-out" ].length - 1; i >= 0; i-- ){

				const elementID = this.controlGroup[ "top-out" ][ i ];
				const elementY = this._ioElementsTable._yPositions[ elementID ];

				if ( elementY < currentY ){
					const element = this._ioElementsTable._nodes[ elementID ];
					const elementPossibleEvents = this._ioElementsTable._possibleEvents[ elementID ];
					/**
					 * - Delete element in "top-out" and/or "bottom-out"
					 * - Add to "top-in"
					 */
					const possibleEvents = ([ "top-in" ] as Event[]).filter( value => elementPossibleEvents.includes( value ) );
					this.updateControlGroups( elementID, [ "top-out", "bottom-out" ], possibleEvents );
					this.executeElementFunction( element, "top-out" );
					
				}

			}

		} else {
			
			/**
			 * User SCROLLING UP
			 * Only "top-in" and "bottom-out" are possible
			 * 
			 * @important
			 * Check "top-in" first:
			 * Instant changes on scrollY might be a big value to 
			 * make an element "top-in" first then "bottom-out".
			 * 
			 * @important
			 * We need to iterate over the controlGroup in reverse order. 
			 * This way, removing elements won't affect the indices of the yet-to-be-processed elements.
			 */
			for ( let i = this.controlGroup[ "top-in" ].length - 1; i >= 0; i-- ){

				const elementID = this.controlGroup[ "top-in" ][ i ];
				const elementY = this._ioElementsTable._yPositions[ elementID ];

				if ( elementY > currentY ){
					const element = this._ioElementsTable._nodes[ elementID ];
					const elementPossibleEvents = this._ioElementsTable._possibleEvents[ elementID ];
					/**
					 * - Delete element in "top-in", 
					 * - Add to "top-out" and/or "bottom-out"
					 */
					const possibleEvents = ([ "top-out", "bottom-out" ] as Event[]).filter( value => elementPossibleEvents.includes( value ) );
					this.updateControlGroups( elementID, [ "top-in" ], possibleEvents );
					this.executeElementFunction( element, "top-in" );
					
				}

			}

			/**
			 * @important
			 * We need to iterate over the controlGroup in reverse order. 
			 * This way, removing elements won't affect the indices of the yet-to-be-processed elements.
			 */
			for ( let i = this.controlGroup[ "bottom-out" ].length - 1; i >= 0; i-- ){

				const elementID = this.controlGroup[ "bottom-out" ][ i ];
				const elementY = this._ioElementsTable._yPositions[ elementID ];

				if ( elementY > ( currentY + this.pageHelper._screenHeight ) ){
					const element = this._ioElementsTable._nodes[ elementID ];
					const elementPossibleEvents = this._ioElementsTable._possibleEvents[ elementID ];
					/**
					 * - Delete element in "bottom-out", "top-out"
					 * - Add to "top-in"
					 */
					const possibleEvents = ([ "bottom-in" ] as Event[]).filter( value => elementPossibleEvents.includes( value ) );
					this.updateControlGroups( elementID, [ "bottom-out", "top-out" ], possibleEvents );
					this.executeElementFunction( element, "bottom-out");
					
				}

			}

		}
    }


	private updateControlGroups( elementID: number, oldStatuses: Event[], newStatuses: Event[] ): void 
	{
		// Remove the element from all given groups
		for ( const status of oldStatuses ){
			this.controlGroup[ status ] = this.controlGroup[ status ].filter( id => id != elementID );
		}

		// Add the element to new groups
		for ( const newStatus of newStatuses ){
			// If it doesn't exist, push the element
			if ( ! this.controlGroup[ newStatus ].some( id => id == elementID ) ) {
				this.controlGroup[ newStatus ].push( elementID );
			}
		}

		// console.log({ 
		// 	"top-in": this.controlGroup[ "top-in" ],
		// 	"top-out": this.controlGroup[ "top-out" ],
		// 	"bottom-in": this.controlGroup[ "bottom-in" ],
		// 	"bottom-out": this.controlGroup[ "bottom-out" ],
		// });
	}


    public destroy(): void 
	{
		window.removeEventListener( 'scroll', this.handleScrollBound );
		window.removeEventListener( 'resize', this.handleResizeBound );
		this.controlGroup = {
			"top-in": [],
			"top-out": [],
			"bottom-in": [],
			"bottom-out": [],
		};
    }
}

