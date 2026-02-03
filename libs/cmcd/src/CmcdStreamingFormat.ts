import type { ValueOf } from '@svta/cml-utils'

/**
 * Common Media Client Data Streaming Format
 *
 *
 * @enum
 *
 * @public
 */
export const CmcdStreamingFormat = {
	/**
	 * MPEG DASH
	 */
	DASH: 'd',

	/**
	 * HTTP Live Streaming (HLS)
	 */
	HLS: 'h',

	/**
	 * Smooth Streaming
	 */
	SMOOTH: 's',

	/**
	 * Other
	 */
	OTHER: 'o',
} as const

/**
 * @public
 */
export type CmcdStreamingFormat = ValueOf<typeof CmcdStreamingFormat>;
