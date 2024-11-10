import type { IOVerticalEvent, IONodeOptions, BinaryBoolean } from "../../types/global";


export class PronotronIONode
{
    public id: number;
	public y: number;
	public settings: IONodeOptions;

	/**
	 * Calculated only if viewport is assigned
	 */
	public possibleEvents: undefined | Record<IOVerticalEvent, BinaryBoolean>;

    constructor( settings: IONodeOptions, id: number )
	{
        this.id = id;

		/**
		 * Calculate initial y position.
		 * Node might be added between route changes. So setViewport() bulk setting Y positions might not run.
		 */
		this.y = settings.getYPosition();
		this.settings = settings;
    }

	/**
	 * Calculates possible events can node dispatch by
	 * 
	 * @param viewportHeight Visible viewport height
	 * @param totalPossibleScroll Max Y scroll value
	 */
	calculatePossibleEvents( viewportHeight: number, totalPossibleScroll: number ): void
	{				
		this.possibleEvents = { 
			"top-in": 0, 
			"top-out": 0, 
			"bottom-in": 0, 
			"bottom-out": 0 
		};

		if ( this.y < viewportHeight ){

			/**
			 * Element Y position is smaller than screen height.
			 * Element can only dispatch "top-in" and "top-out".
			 */
			if ( this.y > totalPossibleScroll ){
				/**
				 * Element Y position is bigger than totalPossibleScroll. Element can't dispatch any event.
				 * This is the only scenario when an element can't dispatch any event.
				 * 
				 * @note
				 * This is a design matter. Scroll area may expanded or more nodes may be added lately.
				 */
				// console.warn( "Element can't dispatch any event" );
				return;
			} else {
				this.possibleEvents[ "top-in" ] = 1;
				this.possibleEvents[ "top-out" ] = 1;
			}

		} else {

			/**
			 * Element Y position is bigger than screen height.
			 * Element can dispatch "bottom-in" and "bottom-out".
			 */
			this.possibleEvents[ "bottom-in" ] = 1;
			this.possibleEvents[ "bottom-out" ] = 1;

			// Is totalPossibleScroll is enough to element can "top-out"?
			const canTopOut = this.y < totalPossibleScroll;

			if ( canTopOut ){
				this.possibleEvents[ "top-in" ] = 1;
				this.possibleEvents[ "top-out" ] = 1;
			}

		}
	}
}