
/**
 * In interleaved controlTable, how an item maintained
 */
export enum NodeData {
	BottomIn = 0,
	TopIn = 1,
	BottomOut = 2,
	TopOut = 3,
	NodeYPosition = 4,
	NodeID = 5
};

export class PronotronIONode
{
    private static currentId: number = 0;

    public id: number;
	public y: number;
	public controlTable: number[] = [];

    constructor()
	{
        this.id = PronotronIONode.generateId();
		this.y = 0;
		this.controlTable[ NodeData.BottomIn ] = 0;
		this.controlTable[ NodeData.BottomOut ] = 0;
		this.controlTable[ NodeData.TopIn ] = 0;
		this.controlTable[ NodeData.TopOut ] = 0;
		this.controlTable[ NodeData.NodeYPosition ] = this.y;
		this.controlTable[ NodeData.NodeID ] = this.id;
    }

    static generateId(): number 
	{
        return ++PronotronIONode.currentId;
    }

	resetControlTable()
	{
		this.controlTable[ NodeData.TopIn ] = 0;
		this.controlTable[ NodeData.TopOut ] = 1;
		this.controlTable[ NodeData.BottomIn ] = 1;
		this.controlTable[ NodeData.BottomOut ] = 0;
	}

	/**
	 * Calculates possible events by
	 * 
	 * @param viewportHeight Visible viewport height
	 * @param totalPossibleScroll Max Y scroll value
	 */
	calculatePossibleEvents( viewportHeight: number, totalPossibleScroll: number ): void
	{		
		this.controlTable[ NodeData.NodeYPosition ] = this.y;
		this.controlTable[ NodeData.NodeID ] = this.id;
		
		if ( this.y < viewportHeight ){
			/**
			 * Element Y position is smaller than screen height.
			 * Element can only "top-out" and "top-in".
			 */
			if ( this.y > totalPossibleScroll ){
				/**
				 * Element Y position is bigger than totalPossibleScroll. Element can't dispatch any event.
				 */
				console.warn( "Element can't dispatch any event" );
				return;
			} else {
				this.controlTable[ NodeData.TopIn ] = 1;
				this.controlTable[ NodeData.TopOut ] = 1;
			}
		} else {
			/**
			 * Element Y position is bigger than screen height.
			 * Element can "bottom-in" and "bottom-out"
			 */
			this.controlTable[ NodeData.BottomIn ] = 1;
			this.controlTable[ NodeData.BottomOut ] = 1;

			// Is totalPossibleScroll is enough to element can "top-out"?
			const canTopOut = this.y < totalPossibleScroll;

			if ( canTopOut ){
				this.controlTable[ NodeData.TopIn ] = 1;
				this.controlTable[ NodeData.TopOut ] = 1;
			}
		}
	}
}