import { PronotronClock } from "../clock/PronotronClock";
import { NativeControlTable } from "../native-control-table/NativeControlTable";
import { IDPool } from "../utils/IDPool";

enum AnimationData {
	ID,
	DURATION,
	STARTTIME,
	ENDTIME,
	RENDERABLE,
	TIMESTYLE,
};

type AnimationOptionID = string;
type AnimationInternalID = number;
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
	 * @param forced Is animation forcibly finished. (With using removeAnimation())
	 */
	onEnd: ( forced: boolean ) => void;
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
	 * A number ID is generated for each animation to be holdable in the typed control array.
	 */
	private _animationOptionIDtoInternalID = new Map<AnimationOptionID, AnimationInternalID>();

	/**
	 * Stores options passed when creating animations, 
	 * allowing access to onRender(), onEnd(), etc.
	 * 
	 * The key is a number to facilitate passing to NativeControlTable.
	 */
	private _animationReferences: Record<AnimationInternalID, AnimationOption> = {};

	private _clock: PronotronClock;
	private _animationInternalIDsPool: IDPool;
	private _controlTable: NativeControlTable<typeof AnimationData>;

	/**
	 * @param clock Clock instance
	 * @param nodeCountHint Max expected animation object at the same time, will be auto expand if needed
	 */
	constructor( clock: PronotronClock, nodeCountHint = 20 )
	{
		this._clock = clock;
		this._animationInternalIDsPool = new IDPool( nodeCountHint );
		this._controlTable = new NativeControlTable( 6, Float32Array, nodeCountHint );
	}

	getAnimationCount(): number {
		return this._controlTable.usedSlots;
	}

	/**
	 * Adds an animation to tick
	 * 
	 * @param animationOption 
	 */
	addAnimation( animationOption: AnimationOption ): void
	{
		if ( this._controlTable.isSlotExist( animationOption.id ) ){
			this.removeAnimation( animationOption.id, true );
		}

		const animationInternalID = this._animationInternalIDsPool.getID();
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
		this._animationOptionIDtoInternalID.set( animationOption.id, animationInternalID );
		this._animationInternalIDsPool.consumeID( animationInternalID );
		this._animationReferences[ animationInternalID ] = animationOption;
	}

	/**
	 * Removes an animation using the given animationID.
	 * 
	 * @param animationID The animation ID provided during creation.
	 * @param complete If true, runs the onEnd( forced: true ) method of the animation before removal, if it exists.
	 */
	removeAnimation( animationID: AnimationOptionID, complete?: boolean ): void
	{
		const animationInternalID = this._animationOptionIDtoInternalID.get( animationID );

		if ( animationInternalID !== undefined ){

			if ( complete && ( "onEnd" in this._animationReferences[ animationInternalID ] ) ){
				this._animationReferences[ animationInternalID ].onEnd( true );
			}

			this._removeAnimationByInternalID( animationInternalID );

		} else {
			console.warn( `AnimationID: '${ animationID }' does not exist.` );
		}
	}

	tick(): void
	{
		const elapsedTime = this._clock.elapsedTime;
		const elapsedPausedTime = this._clock.elapsedPausedTime;

		/**
		 * Iterate reverse order to avoid removed elements mix up iteration.
		 * If a node is removed in _controlTable, the last slot is moved to removed slot position
		 */
		for ( let i = this._controlTable.usedSlots - 1; i >= 0; i-- ){
		
			const offset = i * this._controlTable.stride;
			const time = this._controlTable.table[ offset + AnimationData.TIMESTYLE ] ? elapsedTime : elapsedPausedTime;

			/**
			 * Animation has onRender() function.
			 * If screen is unfocused, animation needs to be rendered last one time before removed.
			 * So run before endtime control below.
			 */
			if ( this._controlTable.table[ offset + AnimationData.RENDERABLE ] ){
				// @ts-expect-error - onRender is defined if the animation is RENDERABLE
				this._animationReferences[ this._controlTable.table[ offset + AnimationData.ID ] ].onRender( 
					time,
					this._controlTable.table[ offset + AnimationData.STARTTIME ], 
					this._controlTable.table[ offset + AnimationData.DURATION ] 
				);
			}

			/**
			 * Check if the animation is finished.
			 */
			if ( time > this._controlTable.table[ offset + AnimationData.ENDTIME ] ){
				const animationInternalID = this._controlTable.table[ offset + AnimationData.ID ];
				if ( "onEnd" in this._animationReferences[ animationInternalID ] ){
					this._animationReferences[ animationInternalID ].onEnd( false );
				}
				this._removeAnimationByInternalID( animationInternalID );
			}
		}
	}

	/**
	 * During ticking, only the generated animationInternalID stored in NativeControlTable is available.
	 * 
	 * @param animationInternalID The generated number when adding an animation.
	 */
	private _removeAnimationByInternalID( animationInternalID: AnimationInternalID ): void
	{
		const animationID = this._animationReferences[ animationInternalID ].id;

		this._controlTable.removeSlot( animationID );
		this._animationOptionIDtoInternalID.delete( animationID );
		this._animationInternalIDsPool.releaseID( animationInternalID );
		delete this._animationReferences[ animationInternalID ];
	}
}
