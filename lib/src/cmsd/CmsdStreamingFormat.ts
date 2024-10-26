/**
 * Common Media Server Data Streaming Format
 *
 * @group CMSD
 *
 * @enum
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
 * @internal
 */
export type CmsdStreamingFormat = typeof CmsdStreamingFormat[keyof typeof CmsdStreamingFormat];
