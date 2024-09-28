import { PronotronNodeID } from "../../types/global";
import { NodeData } from "./PronotronIONode";

export class PronotronIOControlTable
{
	/**
	 * High frequency interleaved flatten @type {NodeData} table.
	 */
	table!: Uint16Array;
	nodeCount!: number;
	nodeDataSize: number;

	nodePositions = new Map<PronotronNodeID, number>();

	constructor()
	{
		/**
		 * @see https://stackoverflow.com/questions/38034673/determine-the-number-of-enum-elements-typescript
		 */
		this.nodeDataSize = Object.keys( NodeData ).length / 2;
	}

	addNode( nodeID: PronotronNodeID ): void
	{
		if ( ! this.nodePositions.has( nodeID ) ){

			this.nodePositions.set( nodeID, this.nodePositions.size );
		}
		console.warn( `NodeID: '${ nodeID }' is already exist in the control table.` );
	}

	removeNodes( ...nodeIDs: PronotronNodeID[] ): void
	{
		const newControlTable = new Uint16Array( ( this.nodeCount - nodeIDs.length ) * this.nodeDataSize );
		let newIndex = 0;

		for ( let i = 0; i < this.nodeCount; i++ ){

			const offset = i * this.nodeDataSize;
			const currentNodeID = this.table[ offset + NodeData.NodeID ];

			if ( nodeIDs.includes( currentNodeID ) ){
				continue;
			}

			const newOffset = newIndex * this.nodeDataSize;

			newControlTable[ newOffset ] = this.table[ offset + 0 ];
			newControlTable[ newOffset + 1 ] = this.table[ offset + 1 ];
			newControlTable[ newOffset + 2 ] = this.table[ offset + 2 ];
			newControlTable[ newOffset + 3 ] = this.table[ offset + 3 ];
			newControlTable[ newOffset + 4 ] = this.table[ offset + 4 ];
			newControlTable[ newOffset + 5 ] = this.table[ offset + 5 ];

			newIndex++;

		}

		this.table = newControlTable;
		this.nodeCount -= nodeIDs.length;
	}

	/**
	 * Updates node's tracking events in _controlTable
	 * 
	 * @param nodeOffset Node start index in interleaved _controlTable native array
	 * @param topIn Track "top-in"
	 * @param topOut Track "top-out"
	 * @param bottomIn Track "bottom-in"
	 * @param bottomOut Track "bottom-out"
	 */
	updateControlTable( nodeOffset: number, topIn: 1 | 0, topOut: 1 | 0, bottomIn: 1 | 0, bottomOut: 1 | 0 ): void
	{
		this.table[ nodeOffset + NodeData.TopIn ] = topIn;
		this.table[ nodeOffset + NodeData.TopOut ] = topOut;
		this.table[ nodeOffset + NodeData.BottomIn ] = bottomIn;
		this.table[ nodeOffset + NodeData.BottomOut ] = bottomOut;
	}

}