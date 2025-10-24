import { PronotronClock } from "../clock/PronotronClock";
import { NativeControlTable } from "../native-control-table/NativeControlTable";
import { IDPool } from "../utils/IDPool";
import { type RequireAtLeastOne } from "../utils/Types";

/**
 * Calculating AnimationData stride with code, causes to make it constant. 
 * The size of AnimationData is fixed.
 */
const ANIMATION_DATA_STRIDE = 7;

/**
 * Enumerates indices of animation data fields stored in NativeControlTable.
 * Each value corresponds to a column offset for a single animation entry.
 */
enum AnimationData
{
	ID,
	DURATION,
	STARTTIME,
	ENDTIME,
	RENDERABLE,
	/**
	 * Indicates which clock domain the animation follows.
	 * {@link AnimationTimeStyle}
	 */
	TIMESTYLE,
	/**
	 * Indicates the current runtime state of the animation.
	 * {@link AnimationStatus}
	 */
	STATUS
};

enum AnimationStatus
{
	/** Animation is scheduled but has not yet started (due to delay). */
	PENDING,
	/** Animation is actively rendering and receiving onRender() updates. */
	RENDERING,
	/** Animation is temporarily paused and will resume later. @NotImplemented */
	PAUSED
};

enum AnimationTimeStyle
{
	/** Time progression pauses when the screen or tab is unfocused. */
	PAUSABLE,
	/** Time progression continues regardless of focus state. */
	CONTINIOUS
};

/**
 * Client-facing string identifier for an animation.
 * Provided externally when creating an animation.
 */
type AnimationClientID = string;
/**
 * Internal numeric identifier for an animation.
 * Assigned internally by the animation controller.
 */
type AnimationInternalID = number;

/**
 * Describes the configuration of an animation instance.
 */
export type AnimationOption = RequireAtLeastOne<CallbackOption> & {
	/**
	 * Unique client-provided identifier.
	 * Adding an animation with the same ID forcibly finishes the previous one.
	 */
	id: AnimationClientID;
	/**
	 * Whether the animation should pause when screen is unfocused.
	 * true → pauses when unfocused
	 * false → continues ticking
	 */
	autoPause: boolean;
	/**
	 * Animation duration in seconds.
	 */
	duration: number ;
	/**
	 * Optional delay before animation start, in seconds.
	 */
	delay?: number;
};

type CallbackOption = {
	/**
	 * Called when the animation begins.
	 */ 
	onBegin: () => void
	/**
	 * Called when the animation finishes.
	 * @param forced Indicates whether the animation was forcibly terminated (via removeAnimation()).
	 */
	onEnd: ( forced: boolean ) => void;
	/**
	 * Called each frame if defined.
	 * Provides timing information relative to the animation start and duration.
	 */
	onRender: ( currentTime: number, startTime: number, duration: number ) => void;
};

/**
 * PronotronAnimator - Controls scheduling, updating, and lifecycle management of animations.
 * 
 * @example
 * ```ts
 * const clock = new PronotronClock();
 * const animator = new PronotronAnimator( clock, 50 );
 * animator.add({
 * 	id: `unique_animation_id`,
 * 	duration: 3.0, // in seconds
 * 	delay: 0.5, // in seconds
 * 	autoPause: true, // Animation pauses when screen is unfocused
 * 	onBegin: ( currentTime, startTime, duration ) => {
 * 		console.log( "Animation begin" );
 * 	},
 * 	onRender: ( currentTime, startTime, duration ) => {
 * 		const timeline = ( currentTime - startTime ) / duration;
 * 		console.log( Math.min( timeline, 1.0 ) );
 * 	},
 * 	onEnd: ( forced ) => {
 * 		if ( ! forced ){
 * 			console.log( "Animation finished naturally" );
 * 		} 
 * 	}
 * });
 * ```
 */
export class PronotronAnimator
{
	/**
	 * Maps external animation client IDs to internal numeric IDs.
	 * @internal
	 */
	private _animationClientIDtoInternalID = new Map<AnimationClientID, AnimationInternalID>();

	/**
	 * Stores references to animation option objects for callback access.
	 * @internal
	 */
	private _animationReferences: AnimationOption[] = [];

	/**
	 * Shared time source.
	 * @internal
	 */
	private _clock: PronotronClock;

	/**
	 * Pool for recycling internal animation IDs.
	 * @internal
	 */
	private _animationInternalIDsPool: IDPool;

	/**
	 * Native control table used to store compact per-animation data.
	 * @internal
	 */
	private _controlTable: NativeControlTable<AnimationData>;

	/**
	 * @param clock The global clock used for animation timing.
	 * @param nodeCountHint Max expected animation object at the same time, will be auto expand if needed
	 */
	constructor( clock: PronotronClock, nodeCountHint = 20 )
	{
		this._clock = clock;
		this._animationInternalIDsPool = new IDPool( nodeCountHint );
		this._controlTable = new NativeControlTable( ANIMATION_DATA_STRIDE, Float32Array, nodeCountHint );
	}

	/**
	 * Adds an animation to the controller.
	 * If another animation with the same ID exists, it is removed first.
	 *
	 * @param animationOption Animation configuration.
	 * @returns The registered animation option reference.
	 */
	add( animationOption: AnimationOption ): void
	{
		if ( this._controlTable.isExist( animationOption.id ) ){
			this.remove( animationOption.id, true );
		}

		const { elapsedTime, elapsedPausedTime } = this._clock.getTime();

		const animationInternalID = this._animationInternalIDsPool.get();
		const now = animationOption.autoPause ? elapsedPausedTime : elapsedTime;
		const duration = animationOption.duration || 0;
		const delay = animationOption.delay || 0;
		const startTime = now + delay;
		const endTime = startTime + duration;

		this._controlTable.add( animationOption.id, {
			[ AnimationData.ID ]: animationInternalID,
			[ AnimationData.DURATION ]: duration,
			[ AnimationData.STARTTIME ]: startTime,
			[ AnimationData.ENDTIME ]: endTime,
			[ AnimationData.RENDERABLE ]: animationOption.onRender ? 1 : 0,
			[ AnimationData.TIMESTYLE ]: animationOption.autoPause ? AnimationTimeStyle.PAUSABLE : AnimationTimeStyle.CONTINIOUS,
			[ AnimationData.STATUS ]: AnimationStatus.PENDING,
		} );

		this._animationClientIDtoInternalID.set( animationOption.id, animationInternalID );
		this._animationInternalIDsPool.consume( animationInternalID );
		this._animationReferences[ animationInternalID ] = animationOption;
	}

	/**
	 * Removes an animation by its external ID.
	 *
	 * @param animationID The ID used when adding the animation.
	 * @param forced If true, calls onEnd(forced = true) before removal.
	 */
	remove( animationID: AnimationClientID, forced = false ): void
	{
		const animationInternalID = this._animationClientIDtoInternalID.get( animationID );

		if ( animationInternalID !== undefined ){

			this._animationReferences[ animationInternalID ].onEnd?.( forced );
			this._removeAnimationByInternalID( animationInternalID );

		} else {

			console.warn( `AnimationID: '${ animationID }' does not exist.` );

		}
	}

	/**
	 * Updates all active animations.
	 * Should be called once per frame.
	 */
	tick(): void
	{
		const { table, usedSlots, stride } = this._controlTable;
		const { elapsedTime, elapsedPausedTime } = this._clock.getTime();
		
		for ( let i = 0; i < usedSlots; i++ ){
		
			const offset = i * stride;
			const time = ( table[ offset + AnimationData.TIMESTYLE ] === AnimationTimeStyle.CONTINIOUS ) ? elapsedTime : elapsedPausedTime;
			const startTime = table[ offset + AnimationData.STARTTIME ];

			// Skip animations that haven't started yet (due to delay).
			if ( time < startTime ) continue;

			const internalID = table[ offset + AnimationData.ID ];
			const duration = table[ offset + AnimationData.DURATION ];
			const animationReference = this._animationReferences[ internalID ];

			// Change status for the beginning
			if ( table[ offset + AnimationData.STATUS ] === AnimationStatus.PENDING ){
				table[ offset + AnimationData.STATUS ] = AnimationStatus.RENDERING;
				animationReference.onBegin?.();
			}

			/**
			 * - Animation has onRender() function.
			 * - If screen is unfocused, animation needs to be rendered last one time before removed.
			 * 	So run before endtime control below.
			 */
			if ( table[ offset + AnimationData.RENDERABLE ] ){
				// @ts-expect-error - onRender is defined if the animation is RENDERABLE
				animationReference.onRender( time, startTime, duration );
			}

			/**
			 * Check if the animation is finished.
			 */
			if ( time > table[ offset + AnimationData.ENDTIME ] ){
				animationReference.onEnd?.( false );
				this._removeAnimationByInternalID( internalID );
			}
		}
	}

	/**
	 * Removes an animation by its internal numeric ID.
	 * Used internally during ticking and forced removal.
	 *
	 * @param animationInternalID The allocated numeric ID for the animation.
	 * @internal
	 */
	private _removeAnimationByInternalID( animationInternalID: AnimationInternalID ): void
	{
		const animationID = this._animationReferences[ animationInternalID ].id;

		this._controlTable.remove( animationID );
		this._animationClientIDtoInternalID.delete( animationID );
		this._animationInternalIDsPool.release( animationInternalID );
		this._animationReferences[ animationInternalID ] = undefined as any;
	}
}
