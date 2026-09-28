import type { ValueOf } from '@svta/cml-utils'

/**
 * CMCD event type 'bc' (bitrate change).
 *
 * @public
 */
export const CMCD_EVENT_BITRATE_CHANGE = 'bc' as const

/**
 * CMCD event type 'ps' (play state change).
 *
 * @public
 */
export const CMCD_EVENT_PLAY_STATE = 'ps' as const

/**
 * CMCD event type 'pr' (playback rate change).
 *
 * @public
 */
export const CMCD_EVENT_PLAYBACK_RATE = 'pr' as const

/**
 * CMCD event type 'e' (error).
 *
 * @public
 */
export const CMCD_EVENT_ERROR = 'e' as const

/**
 * CMCD event type 't' (time interval).
 *
 * @public
 */
export const CMCD_EVENT_TIME_INTERVAL = 't' as const

/**
 * CMCD event type 'c' (content ID).
 *
 * @public
 */
export const CMCD_EVENT_CONTENT_ID = 'c' as const

/**
 * CMCD event type 'b' (backgrounded mode).
 *
 * @public
 */
export const CMCD_EVENT_BACKGROUNDED_MODE = 'b' as const

/**
 * CMCD event type 'm' (mute).
 *
 * @public
 */
export const CMCD_EVENT_MUTE = 'm' as const

/**
 * CMCD event type 'um' (unmute).
 *
 * @public
 */
export const CMCD_EVENT_UNMUTE = 'um' as const

/**
 * CMCD event type 'pe' (player expand).
 *
 * @public
 */
export const CMCD_EVENT_PLAYER_EXPAND = 'pe' as const

/**
 * CMCD event type 'pc' (player collapse).
 *
 * @public
 */
export const CMCD_EVENT_PLAYER_COLLAPSE = 'pc' as const

/**
 * CMCD event type 'rr' (response received).
 *
 * @public
 */
export const CMCD_EVENT_RESPONSE_RECEIVED = 'rr' as const

/**
 * CMCD event type 'as' (ad start).
 *
 * @public
 */
export const CMCD_EVENT_AD_START = 'as' as const

/**
 * CMCD event type 'ae' (ad end).
 *
 * @public
 */
export const CMCD_EVENT_AD_END = 'ae' as const

/**
 * CMCD event type 'abs' (ad break start).
 *
 * @public
 */
export const CMCD_EVENT_AD_BREAK_START = 'abs' as const

/**
 * CMCD event type 'abe' (ad break end).
 *
 * @public
 */
export const CMCD_EVENT_AD_BREAK_END = 'abe' as const

/**
 * CMCD event type 'sk' (skip).
 *
 * @public
 */
export const CMCD_EVENT_SKIP = 'sk' as const

/**
 * CMCD event type 'ce' (custom event).
 *
 * @public
 */
export const CMCD_EVENT_CUSTOM_EVENT = 'ce' as const

/**
 * CMCD event types for the 'e' key (event mode).
 *
 * @enum
 *
 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#event | CTA-5004-B Event}
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
	 * A change in the playback rate.
	 */
	PLAYBACK_RATE: CMCD_EVENT_PLAYBACK_RATE as typeof CMCD_EVENT_PLAYBACK_RATE,

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
	 * A change in the player's backgrounded state.
	 */
	BACKGROUNDED_MODE: CMCD_EVENT_BACKGROUNDED_MODE as typeof CMCD_EVENT_BACKGROUNDED_MODE,

	/**
	 * The player was muted.
	 */
	MUTE: CMCD_EVENT_MUTE as typeof CMCD_EVENT_MUTE,

	/**
	 * The player was unmuted.
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
