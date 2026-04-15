import type { ValueOf } from '@svta/cml-utils';

/**
 * Common Media Client Data Streaming Format
 *
 * @enum
 *
 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#streaming-format | CTA-5004-B Streaming Format}
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
