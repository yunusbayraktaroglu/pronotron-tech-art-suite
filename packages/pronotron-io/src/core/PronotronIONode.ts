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
}