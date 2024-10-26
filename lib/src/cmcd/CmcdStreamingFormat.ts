/**
 * Common Media Client Data Streaming Format
 *
 * @group CMCD
 *
 * @beta
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
} as const;

/**
 * Common Media Client Data Streaming Format
 *
 * @group CMCD
 *
 * @see {@link CmcdStreamingFormat}
 *
 * @beta
 */
export type CmcdStreamingFormat = typeof CmcdStreamingFormat[keyof typeof CmcdStreamingFormat];
