import { PronotronClock } from "../clock/PronotronClock";
import { NativeControlTable } from "../native-control-table/NativeControlTable";

type AnimationOptionID = string;
type AnimationInternalID = number;
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
	 * Duration of the animation in seconds.
	 */
	duration: number;
	/**
	 * - pausable: Time does not progress when the screen is unfocused.
	 * - continious: Time continues to progress even when the screen is unfocused.
	 */
	timeStyle: "pausable" | "continious",
} & ({
	/**
	 * Can be used as a callback for when the animation ends, with two time styles available.
	 */
	onEnd: () => void;
	/**
	 * Determines if onEnd() should be executed if the animation is forcibly ended 
	 * (e.g., by adding a new animation with the same ID).
	 */
	forceFinish: "runOnEnd" | "doNotRunOnEnd";
	onRender?: ( currentTime: number, startTime: number, duration: number ) => void;
} | {
	onRender: ( currentTime: number, startTime: number, duration: number ) => void;
});

/**
 * 1. Generates an internalID number that points given client animationID
 * 2. Adds to nativeControlTable with given ID ( givenID -> slotPosition )
 */
export class PronotronAnimationController
{
	/**
	 * Stores options passed when creating animations, 
	 * allowing access to onRender(), onEnd(), etc.
	 * 
	 * The key is a number to facilitate passing to NativeControlTable.
	 */
	private _animationReferences: Record<AnimationInternalID, AnimationOption> = {};

	/**
	 * Holds generated internal IDs for each created animation.
	 */
	private _animationInternalIDs = new Map<AnimationOptionID, AnimationInternalID>();
	private _animationInternalIDsTable: Uint8Array;

	private _controlTable: NativeControlTable<typeof AnimationData>;
	private _clock: PronotronClock;
	
	constructor( clock: PronotronClock, nodeCountHint = 20 )
	{
		this._clock = clock;
		this._controlTable = new NativeControlTable( AnimationData, nodeCountHint );
		this._animationInternalIDsTable = new Uint8Array( nodeCountHint ).fill( 1 );
	}

	addAnimation( animationOption: AnimationOption )
	{
		if ( this._controlTable.isSlotExist( animationOption.id ) ){
			this.removeAnimation( animationOption.id, true );
		}

		const animationInternalID = this._findEmptyID();
		const now = animationOption.timeStyle === "continious" ? this._clock.elapsedTime : this._clock.elapsedPausedTime;

		// Add animation
		this._controlTable.addSlot( animationOption.id, {
			[ AnimationData.ID ]: animationInternalID,
			[ AnimationData.DURATION ]: animationOption.duration,
			[ AnimationData.STARTTIME ]: now,
			[ AnimationData.ENDTIME ]: now + animationOption.duration,
			[ AnimationData.RENDERABLE ]: animationOption.onRender ? 1 : 0,
			[ AnimationData.TIMESTYLE] : animationOption.timeStyle === "continious" ? 1 : 0,
		});
		this._animationInternalIDs.set( animationOption.id, animationInternalID );
		this._animationInternalIDsTable[ animationInternalID ] = 0; // Consume id
		this._animationReferences[ animationInternalID ] = animationOption;
	}

	/**
	 * Removes an animation using the given animation ID.
	 * 
	 * @param animationID The animation ID provided during creation.
	 * @param complete If true, runs the onEnd() method of the animation before removal, if it exists.
	 */
	removeAnimation( animationID: string, complete?: boolean ): void
	{
		const animationInternalID = this._animationInternalIDs.get( animationID );

		if ( animationInternalID !== undefined ){

			// Runs the animation's onEnd() method (if present) before removal
			if ( complete && ( "forceFinish" in this._animationReferences[ animationInternalID ] ) ){
				if ( this._animationReferences[ animationInternalID ].forceFinish === "runOnEnd" ){
					this._animationReferences[ animationInternalID ].onEnd();
				}
			}

			this._removeAnimationByInternalID( animationInternalID );

		} else {
			console.warn( `AnimationID: '${ animationID }' does not exist.` );
		}
	}

	tick()
	{
		const elapsedTime = this._clock.elapsedTime;
		const elapsedPausedTime = this._clock.elapsedPausedTime;

		/**
		 * @bug
		 * Iterate reverse order to avoid removed elements mix up iteration
		 */
		for ( let i = 0; i < this._controlTable._usedSlots; i++ ){
		
			const offset = i * this._controlTable._stride;
			const time = this._controlTable._controlTable[ offset + AnimationData.TIMESTYLE ] ? elapsedTime : elapsedPausedTime;

			/**
			 * Animation has onRender() function.
			 * If screen is unfocused, animation needs to be rendered last one time before removed.
			 * So run before endtime control below.
			 */
			if ( this._controlTable._controlTable[ offset + AnimationData.RENDERABLE ] ){
				// @ts-expect-error - onRender is defined if the animation is RENDERABLE
				this._animationReferences[ this._controlTable._controlTable[ offset + AnimationData.ID ] ].onRender( 
					time,
					this._controlTable._controlTable[ offset + AnimationData.STARTTIME ], 
					this._controlTable._controlTable[ offset + AnimationData.DURATION ] 
				);
			}

			/**
			 * Check if the animation is finished.
			 */
			if ( time > this._controlTable._controlTable[ offset + AnimationData.ENDTIME ] ){
				const animationInternalID = this._controlTable._controlTable[ offset + AnimationData.ID ];
				if ( "onEnd" in this._animationReferences[ animationInternalID ] ){
					this._animationReferences[ animationInternalID ].onEnd();
				}
				this._removeAnimationByInternalID( animationInternalID );
			}
		}
	}

	/**
	 * During ticking, only the generated animationInternalID stored in NativeControlTable is available.
	 * @param animationInternalID The generated number when adding an animation.
	 */
	private _removeAnimationByInternalID( animationInternalID: number )
	{
		const animationID = this._animationReferences[ animationInternalID ].id;

		this._controlTable.removeSlot( animationID );
		this._animationInternalIDs.delete( animationID );
		this._animationInternalIDsTable[ animationInternalID ] = 1; // Release id
		delete this._animationReferences[ animationInternalID ];
	}

	/**
	 * Returns an available slot.
	 * @fix
	 * Add expandCapacity() method
	 */
	private _findEmptyID(): number
	{
		// Search for an available slot
		for ( let i = 0; i < this._animationInternalIDsTable.length; i++ ){
			if ( this._animationInternalIDsTable[ i ] ){
				return i;
			}
		}

		console.warn( `No available slot found. Expand the capacity.` );
		return -1;
	}
}