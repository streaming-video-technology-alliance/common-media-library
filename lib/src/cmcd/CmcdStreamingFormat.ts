/**
 * Common Media Client Data Streaming Format
 *
 * @group CMCD
 *
 * @beta
 */
export enum CmcdStreamingFormat {
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

