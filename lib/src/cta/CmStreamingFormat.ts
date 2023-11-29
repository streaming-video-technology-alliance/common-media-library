/**
 * Common Media Streaming Format
 *
 * @group CMCD
 * @group CMSD
 *
 * @beta
 */
export enum CmStreamingFormat {
	/**
	 * MPEG DASH
	 */
	DASH = 'd',

	/**
	 * HTTP Live Streaming (HLS)
	 */
	HLS = 'h',

	/**
	 * Smooth Streaming
	 */
	SMOOTH = 's',

	/**
	 * Other
	 */
	OTHER = 'o',
}
