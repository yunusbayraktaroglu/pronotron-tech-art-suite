import { PronotronNodeID } from "../../types/global";
import { PronotronIONode } from "./PronotronIONode";

/**
 * In interleaved controlTable, how an item maintained
 */
export enum NodeData {
	TopIn = 0,
	TopOut = 1,
	BottomIn = 2,
	BottomOut = 3,
	NodeYPosition = 4,
	NodeID = 5,
	IsActive = 6
};

type TrackingData = {
	topIn: 1 | 0,
	topOut: 1 | 0,
	bottomIn: 1 | 0,
	bottomOut: 1 |0
};

/**
 * High frequency interleaved flatten @type { NodeData } table.
 * 
 * @bug
 * PronotronNode id may be bigger than 256.
 */
export class PronotronIOControlTable
{
	table: Uint16Array;
	nodeDataSize: number;

	nodePositions = new Map<PronotronNodeID, number>();
	maxSlot: number;

	constructor( nodeCountHint: number )
	{
		/**
		 * @see https://stackoverflow.com/questions/38034673/determine-the-number-of-enum-elements-typescript
		 */
		this.nodeDataSize = Object.keys( NodeData ).length / 2;
		this.maxSlot = nodeCountHint;
		this.table = new Uint16Array( this.nodeDataSize * nodeCountHint );
	}

	addNode( node: PronotronIONode ): void
	{
		// Nodes are shifting when removed, so empty slot always have to be equal with nodePositions map size
		const emptySlot = this.nodePositions.size;

		this.#assignSlot( emptySlot, node );
		this.nodePositions.set( node.id, emptySlot );
		//console.log( `Added to table: Slot: ${ emptySlot  }. Id: ${ node.id }` );
	}

	deleteNodes( ...nodeIDs: PronotronNodeID[] ): void
	{
		for ( let i = 0; i < nodeIDs.length; i++ ){

			const nodePosition = this.nodePositions.get( nodeIDs[ i ] );
	
			// Slot might be zero, so check for undefined
			if ( nodePosition !== undefined ){

				// Deactivated slot
				const deactivatedSlot = nodePosition * this.nodeDataSize;
	
				// If it is the last node, only update isActive and delete in nodePositions
				if ( this.nodePositions.size === 1 ){
					this.table[ deactivatedSlot + NodeData.IsActive ] = 0;
					this.nodePositions.delete( nodeIDs[ i ] );
					//console.log(`Removed in table: Slot: ${ nodePosition }. Id: ${ nodeIDs[ i ] }`);
					continue;
				}
	
				// Last slot will be moved to deactivated slot
				const lastSlotIndex = this.nodePositions.size - 1;
				const lastSlot = lastSlotIndex * this.nodeDataSize;
	
				// Move last slot to deactivated slot if they're different
				if ( lastSlot !== deactivatedSlot ){
					this.table[ deactivatedSlot + NodeData.NodeID ] = this.table[ lastSlot + NodeData.NodeID ];
					this.table[ deactivatedSlot + NodeData.NodeYPosition ] = this.table[ lastSlot + NodeData.NodeYPosition ];
					this.table[ deactivatedSlot + NodeData.TopIn ] = this.table[ lastSlot + NodeData.TopIn ];
					this.table[ deactivatedSlot + NodeData.TopOut ] = this.table[ lastSlot + NodeData.TopOut ];
					this.table[ deactivatedSlot + NodeData.BottomIn ] = this.table[ lastSlot + NodeData.BottomIn ];
					this.table[ deactivatedSlot + NodeData.BottomOut ] = this.table[ lastSlot + NodeData.BottomOut ];
					this.table[ deactivatedSlot + NodeData.IsActive ] = 1;
	
					// Update the nodePositions map for the node that was moved
					const movedNodeID = this.table[ deactivatedSlot + NodeData.NodeID ];
					this.nodePositions.set( movedNodeID, nodePosition );
				}
	
				// Deactivate the last slot
				this.table[ lastSlot + NodeData.IsActive ] = 0;
	
				// Remove the deleted node from the map
				this.nodePositions.delete( nodeIDs[ i ] );
	
				//console.log( `Removed in table: Slot: ${ nodePosition }. Id: ${ nodeIDs[ i ] }` );
				
			} else {
				throw new Error( `NodeID: '${ nodeIDs[ i ] }' is missing in typed control table.` );
			}
		}
	}


	updateNodeTrackingEvents( nodeID: number, trackingData: TrackingData )
	{
		const nodePosition = this.nodePositions.get( nodeID )!;
		const nodeOffset = nodePosition * this.nodeDataSize;

		// Only "top-out" and "bottom-in" are possible at the start
		this.updateTrackingData( nodeOffset, trackingData.topIn, trackingData.topOut, trackingData.bottomIn, trackingData.bottomOut );
	}


	/**
	 * Runs when screen resized
	 */
	updateYPosition( nodeID: number, yPosition: number ): void 
	{
		const nodePosition = this.nodePositions.get( nodeID )!;
		const nodeOffset = nodePosition * this.nodeDataSize;

		this.table[ nodeOffset + NodeData.NodeYPosition ] = yPosition;

		// Only "top-out" and "bottom-in" are possible at the start
		this.updateTrackingData( nodeOffset, 0, 1, 1, 0 );
	}

	#assignSlot( emptySlot: number, node: PronotronIONode ): void
	{
		const emptyOffset = emptySlot * this.nodeDataSize;

		this.table[ emptyOffset + NodeData.NodeID ] = node.id;
		this.table[ emptyOffset + NodeData.NodeYPosition ] = node.y;
		this.table[ emptyOffset + NodeData.IsActive ] = 1;

		// Only "top-out" and "bottom-in" are possible at the start
		this.updateTrackingData( 
			emptyOffset, 
			0, 
			node.possibleEvents ? node.possibleEvents[ "top-out" ] : 0, 
			node.possibleEvents ? node.possibleEvents[ "bottom-in" ] : 0, 
			0
		);
	}

	/**
	 * Updates node's tracking events in table
	 * 
	 * @param nodeOffset NodeData start position in the interleaved table typed array
	 * @param topIn Track "top-in"
	 * @param topOut Track "top-out"
	 * @param bottomIn Track "bottom-in"
	 * @param bottomOut Track "bottom-out"
	 */
	updateTrackingData( nodeOffset: number, topIn: 1 | 0, topOut: 1 | 0, bottomIn: 1 | 0, bottomOut: 1 | 0 ): void
	{
		this.table[ nodeOffset + NodeData.TopIn ] = topIn;
		this.table[ nodeOffset + NodeData.TopOut ] = topOut;
		this.table[ nodeOffset + NodeData.BottomIn ] = bottomIn;
		this.table[ nodeOffset + NodeData.BottomOut ] = bottomOut;
	}

}