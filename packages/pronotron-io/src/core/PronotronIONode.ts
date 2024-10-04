import { IOEvent, IONodeOptions } from "../../types/global";

type BinaryBoolean = 1 | 0;

export class PronotronIONode
{
    private static currentId: number = 0;

    public id: number;
	public y: number;
	public settings: IONodeOptions;

	/**
	 * Calculated only if viewport data is assigned
	 */
	public possibleEvents: undefined | Record<IOEvent, BinaryBoolean>;

    constructor( settings: IONodeOptions )
	{
        this.id = PronotronIONode.generateId();

		/**
		 * Node might be added between route changes. So setViewport() bulk setting Y positions might not run.
		 * Calculate initial y position.
		 */
		this.y = settings.getYPosition();
		this.settings = settings;
    }

    static generateId(): number 
	{
        return ++PronotronIONode.currentId;
    }

	/**
	 * Calculates possible events by
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
			 * Element can only "top-out" and "top-in".
			 */
			if ( this.y > totalPossibleScroll ){
				/**
				 * Element Y position is bigger than totalPossibleScroll. Element can't dispatch any event.
				 * This is the only scenario when an element can' dispatch any event.
				 */
				console.warn( "Element can't dispatch any event" );
				return;
			} else {
				this.possibleEvents[ "top-in" ] = 1;
				this.possibleEvents[ "top-out" ] = 1;
			}
		} else {
			/**
			 * Element Y position is bigger than screen height.
			 * Element can "bottom-in" and "bottom-out"
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