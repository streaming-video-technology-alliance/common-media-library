/**
 * Common Media Server Data Streaming Format
 *
 * @group CMSD
 *
 * @beta
 */
export const CmsdStreamingFormat = {
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
 * Common Media Server Data Streaming Format
 *
 * @group CMSD
 * @see {@link CmsdStreamingFormat}
 *
 * @beta
 */
export type CmsdStreamingFormat = typeof CmsdStreamingFormat[keyof typeof CmsdStreamingFormat];
