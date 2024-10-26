/**
 * Common Media Streaming Format
 *
 * @internal
 */
export const CmStreamingFormat = {
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
 * Common Media Streaming Format
 *
 * @see {@link CmcdEncoding}
 * @internal
 */
export type CmStreamingFormat = typeof CmStreamingFormat[keyof typeof CmStreamingFormat];
