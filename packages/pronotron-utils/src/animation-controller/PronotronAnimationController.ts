import { PronotronClock } from "../clock/PronotronClock";

type AnimationOptionID = string;
type AnimationInternalID = number;
type AnimationInternalSlotPosition = number;
enum AnimationData {
	ID,
	DURATION,
	STARTTIME,
	ENDTIME,
	RENDERABLE,
	TIMESTYLE,
};
type AnimationOption = {
	id: AnimationOptionID;
	/**
	 * Animation duration in seconds
	 */
	duration: number;
	/**
	 * - pausable: Time will not ticking when screen is unfocused.
	 * - continious: Time will be ticking even screen is unfocused.
	 */
	timeStyle: "pausable" | "continious",
} & ({
	onRender?: ( currentTime: number, startTime: number, duration: number ) => void;
	onEnd: () => void;
	/**
	 * Should onEnd() executed if the animation ended forcibly? (Adding a new animation with the same id)
	 */
	forceFinish: "runOnEnd" | "doNotRunOnEnd";
} | {
	onRender: ( currentTime: number, startTime: number, duration: number ) => void;
});


export class PronotronAnimationController
{
	clock: PronotronClock;
	animationsTable: Float32Array;
	animationDataSize: number;
	animationTableMaxSlot: number;

	/**
	 * Passed options while animation creation, 
	 * to hold references of onRender(), onEnd(), etc.
	 */
	animationOptions: Record<AnimationInternalID, AnimationOption> = {};

	/**
	 * Holds generated internal ID's for each created animation
	 */
	animationInternalIds = new Map<AnimationOptionID, AnimationInternalID>();
	animationInternalSlotPositions = new Map<AnimationInternalID, AnimationInternalSlotPosition>();
	
	/**
	 * Available internal ID's
	 */
	availableIdsTable = new Uint8Array( 255 ).fill( 1 );

	constructor( clock: PronotronClock, nodeCountHint = 20 )
	{
		this.clock = clock;

		/**
		 * @see https://stackoverflow.com/questions/38034673/determine-the-number-of-enum-elements-typescript
		 */
		this.animationTableMaxSlot = nodeCountHint;
		this.animationDataSize = Object.keys( AnimationData ).length / 2;
		this.animationsTable = new Float32Array( this.animationDataSize * this.animationTableMaxSlot );
	}

	addAnimation( animationOption: AnimationOption )
	{
		const existingAnimationInternalID = this.animationInternalIds.get( animationOption.id );

		// ID might be zero, so check for undefined
		if ( existingAnimationInternalID !== undefined ){
			this.forceFinish( existingAnimationInternalID );
		}

		// Nodes are shifting when removed, so empty slot always have to be equal with nodePositions map size
		const emptySlotPosition = this.animationInternalIds.size;
		const animationInternalID = this.findEmptyID();

		if ( animationInternalID < 0 ){
			console.warn( "No available id" );
			return;
		}

		const now = animationOption.timeStyle === "continious" ? this.clock.elapsedTime : this.clock.elapsedPausedTime;
		const emptyOffset = emptySlotPosition * this.animationDataSize;

		this.animationsTable[ emptyOffset + AnimationData.ID ] = animationInternalID;
		this.animationsTable[ emptyOffset + AnimationData.DURATION ] = animationOption.duration;
		this.animationsTable[ emptyOffset + AnimationData.STARTTIME ] = now;
		this.animationsTable[ emptyOffset + AnimationData.ENDTIME ] = now + animationOption.duration;
		this.animationsTable[ emptyOffset + AnimationData.RENDERABLE ] = animationOption.onRender ? 1 : 0;
		this.animationsTable[ emptyOffset + AnimationData.TIMESTYLE ] = animationOption.timeStyle === "continious" ? 1 : 0;

		// Add to information tables
		this.animationInternalIds.set( animationOption.id, animationInternalID );
		this.animationInternalSlotPositions.set( animationInternalID, emptySlotPosition );
		this.animationOptions[ animationInternalID ] = animationOption;
	}

	forceFinish( animationInternalID: AnimationInternalID )
	{
		if ( "forceFinish" in this.animationOptions[ animationInternalID ] ){
			if ( this.animationOptions[ animationInternalID ].forceFinish === "runOnEnd" ){
				this.animationOptions[ animationInternalID ].onEnd();
			}
		}
		this.removeAnimation( animationInternalID );
	}

	/**
	 * Finds an available index between 0-255 to use as animationInternalID
	 */
	findEmptyID(): number {
		for ( let i = 0; i < this.availableIdsTable.length; i++ ){
			if ( this.availableIdsTable[ i ] ){
				this.availableIdsTable[ i ] = 0; 
				return i;
			}
		}
		return -1;
	}

	/**
	 * We do not remove anything actually,
	 * Only shifting data of the last slot to removed slot, and iterating over 1 less
	 */
	removeAnimation( animationInternalID: AnimationInternalID )
	{
		const animationSlotPosition = this.animationInternalSlotPositions.get( animationInternalID )!;
		const lastSlotPosition = this.animationInternalIds.size - 1; // Correct

		// Move last slot to deactivated slot if they're different
		if ( animationSlotPosition !== lastSlotPosition ){

			const deactivatedOffset = animationSlotPosition * this.animationDataSize;
			const lastSlotOffset = lastSlotPosition * this.animationDataSize;

			this.animationInternalSlotPositions.set( this.animationsTable[ lastSlotOffset + AnimationData.ID ], animationSlotPosition );

			for ( let i = 0; i < this.animationDataSize; i++ ){
				this.animationsTable[ deactivatedOffset + i ] = this.animationsTable[ lastSlotOffset + i ];
			}

		}

		const animationOptionID = this.animationOptions[ animationInternalID ].id;

		// Mark ID as available again
		this.availableIdsTable[ animationInternalID ] = 1;

		// Clean in information tables
		this.animationInternalIds.delete( animationOptionID );
		this.animationInternalSlotPositions.delete( animationInternalID );
		delete this.animationOptions[ animationInternalID ];

		//console.log( this.animationOptions );
		//console.log( this.animationInternalIds );
		//console.log( this.animationInternalSlotPositions );
		//console.log( this.availableIdsTable );
	}
	
	tick()
	{
		for ( let i = 0; i < this.animationInternalIds.size; i++ ){
		
			const offset = i * this.animationDataSize;
			const time = this.animationsTable[ offset + AnimationData.TIMESTYLE ] ? this.clock.elapsedTime : this.clock.elapsedPausedTime;

			/**
			 * Animation has onRender function.
			 * If screen is unfocused, animation needs to be rendered last one time before removed
			 */
			if ( this.animationsTable[ offset + AnimationData.RENDERABLE ] ){
				// @ts-expect-error - onRender is defined if the animation is RENDERABLE
				this.animationOptions[ this.animationsTable[ offset + AnimationData.ID ] ].onRender( 
					time, 
					this.animationsTable[ offset + AnimationData.STARTTIME ], 
					this.animationsTable[ offset + AnimationData.DURATION ] 
				);
			}

			/**
			 * Animation is finished
			 */
			if ( time > this.animationsTable[ offset + AnimationData.ENDTIME ] ){
				const animationInternalID = this.animationsTable[ offset + AnimationData.ID ];
				if ( "onEnd" in this.animationOptions[ animationInternalID ] ){
					this.animationOptions[ animationInternalID ].onEnd();
				}
				this.removeAnimation( animationInternalID );
			}
		}
	}

}