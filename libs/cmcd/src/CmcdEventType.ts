import type { ValueOf } from '@svta/cml-utils'

/**
 * CMCD event types for the 'e' key (event mode).
 *
 *
 * @enum
 *
 * @beta
 */
export const CmcdEventType = {
	/**
	 * A change in the player state.
	 */
	PLAY_STATE: 'ps',

	/**
	 * An error event.
	 */
	ERROR: 'e',

	/**
	 * A periodic report sent on a time interval.
	 */
	TIME_INTERVAL: 't',

	/**
	 * A change of the content ID.
	 */
	CONTENT_ID: 'c',

	/**
	 * A change in the application's backgrounded state.
	 */
	BACKGROUNDED_MODE: 'b',

	/**
	 * The player was muted.
	 */
	MUTE: 'm',

	/**
	 * Player unmuted.
	 */
	UNMUTE: 'um',

	/**
	 * The player view was expanded.
	 */
	PLAYER_EXPAND: 'pe',

	/**
	 * The player view was collapsed.
	 */
	PLAYER_COLLAPSE: 'pc',
} as const

/**
 * @beta
 */
export type CmcdEventType = ValueOf<typeof CmcdEventType>;
