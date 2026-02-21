import type { ValueOf } from '@svta/cml-utils'

/**
 * CMCD event type for the 'bc' key (bitrate change).
 *
 * @public
 */
export const CMCD_EVENT_BITRATE_CHANGE = 'bc' as const

/**
 * CMCD event type for the 'ps' key (play state change).
 *
 * @public
 */
export const CMCD_EVENT_PLAY_STATE = 'ps' as const

/**
 * CMCD event type for the 'e' key (error).
 *
 * @public
 */
export const CMCD_EVENT_ERROR = 'e' as const

/**
 * CMCD event type for the 't' key (time interval).
 *
 * @public
 */
export const CMCD_EVENT_TIME_INTERVAL = 't' as const

/**
 * CMCD event type for the 'c' key (content ID).
 *
 * @public
 */
export const CMCD_EVENT_CONTENT_ID = 'c' as const

/**
 * CMCD event type for the 'b' key (backgrounded mode).
 *
 * @public
 */
export const CMCD_EVENT_BACKGROUNDED_MODE = 'b' as const

/**
 * CMCD event type for the 'm' key (mute).
 *
 * @public
 */
export const CMCD_EVENT_MUTE = 'm' as const

/**
 * CMCD event type for the 'um' key (unmute).
 *
 * @public
 */
export const CMCD_EVENT_UNMUTE = 'um' as const

/**
 * CMCD event type for the 'pe' key (player expand).
 *
 * @public
 */
export const CMCD_EVENT_PLAYER_EXPAND = 'pe' as const

/**
 * CMCD event type for the 'pc' key (player collapse).
 *
 * @public
 */
export const CMCD_EVENT_PLAYER_COLLAPSE = 'pc' as const

/**
 * CMCD event type for the 'rr' key (response received).
 *
 * @public
 */
export const CMCD_EVENT_RESPONSE_RECEIVED = 'rr' as const

/**
 * CMCD event type for the 'as' key (ad start).
 *
 * @public
 */
export const CMCD_EVENT_AD_START = 'as' as const

/**
 * CMCD event type for the 'ae' key (ad end).
 *
 * @public
 */
export const CMCD_EVENT_AD_END = 'ae' as const

/**
 * CMCD event type for the 'abs' key (ad break start).
 *
 * @public
 */
export const CMCD_EVENT_AD_BREAK_START = 'abs' as const

/**
 * CMCD event type for the 'abe' key (ad break end).
 *
 * @public
 */
export const CMCD_EVENT_AD_BREAK_END = 'abe' as const

/**
 * CMCD event type for the 'sk' key (skip).
 *
 * @public
 */
export const CMCD_EVENT_SKIP = 'sk' as const

/**
 * CMCD event type for the 'ce' key (custom event).
 *
 * @public
 */
export const CMCD_EVENT_CUSTOM_EVENT = 'ce' as const

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
	 * A change in the bitrate.
	 */
	BITRATE_CHANGE: CMCD_EVENT_BITRATE_CHANGE as typeof CMCD_EVENT_BITRATE_CHANGE,

	/**
	 * A change in the player state.
	 */
	PLAY_STATE: CMCD_EVENT_PLAY_STATE as typeof CMCD_EVENT_PLAY_STATE,

	/**
	 * An error event.
	 */
	ERROR: CMCD_EVENT_ERROR as typeof CMCD_EVENT_ERROR,

	/**
	 * A periodic report sent on a time interval.
	 */
	TIME_INTERVAL: CMCD_EVENT_TIME_INTERVAL as typeof CMCD_EVENT_TIME_INTERVAL,

	/**
	 * A change of the content ID.
	 */
	CONTENT_ID: CMCD_EVENT_CONTENT_ID as typeof CMCD_EVENT_CONTENT_ID,

	/**
	 * A change in the application's backgrounded state.
	 */
	BACKGROUNDED_MODE: CMCD_EVENT_BACKGROUNDED_MODE as typeof CMCD_EVENT_BACKGROUNDED_MODE,

	/**
	 * The player was muted.
	 */
	MUTE: CMCD_EVENT_MUTE as typeof CMCD_EVENT_MUTE,

	/**
	 * Player unmuted.
	 */
	UNMUTE: CMCD_EVENT_UNMUTE as typeof CMCD_EVENT_UNMUTE,

	/**
	 * The player view was expanded.
	 */
	PLAYER_EXPAND: CMCD_EVENT_PLAYER_EXPAND as typeof CMCD_EVENT_PLAYER_EXPAND,

	/**
	 * The player view was collapsed.
	 */
	PLAYER_COLLAPSE: CMCD_EVENT_PLAYER_COLLAPSE as typeof CMCD_EVENT_PLAYER_COLLAPSE,

	/**
	 * The receipt of a response.
	 */
	RESPONSE_RECEIVED: CMCD_EVENT_RESPONSE_RECEIVED as typeof CMCD_EVENT_RESPONSE_RECEIVED,

	/**
	 * The start of an ad.
	 */
	AD_START: CMCD_EVENT_AD_START as typeof CMCD_EVENT_AD_START,

	/**
	 * The end of an ad.
	 */
	AD_END: CMCD_EVENT_AD_END as typeof CMCD_EVENT_AD_END,

	/**
	 * The start of an ad break.
	 */
	AD_BREAK_START: CMCD_EVENT_AD_BREAK_START as typeof CMCD_EVENT_AD_BREAK_START,

	/**
	 * The end of an ad break.
	 */
	AD_BREAK_END: CMCD_EVENT_AD_BREAK_END as typeof CMCD_EVENT_AD_BREAK_END,

	/**
	 * The user skipped an ad.
	 */
	SKIP: CMCD_EVENT_SKIP as typeof CMCD_EVENT_SKIP,

	/**
	 * A custom event.
	 */
	CUSTOM_EVENT: CMCD_EVENT_CUSTOM_EVENT as typeof CMCD_EVENT_CUSTOM_EVENT,
} as const

/**
 * @public
 */
export type CmcdEventType = ValueOf<typeof CmcdEventType>;
