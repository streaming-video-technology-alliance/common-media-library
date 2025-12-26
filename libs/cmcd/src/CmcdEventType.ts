import type { ValueOf } from '@svta/cml-utils'

/**
 * CMCD event types for the 'e' key (event mode).
 *
 *
 * @enum
 *
 * @public
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

	/**
	 * The receipt of a response.
	 */
	RESPONSE_RECEIVED: 'rr',
} as const

/**
 * @public
 */
export type CmcdEventType = ValueOf<typeof CmcdEventType>;
