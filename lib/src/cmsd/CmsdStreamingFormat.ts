/**
 * Common Media Server Data Streaming Format
 *
 * @group CMSD
 *
 * @beta
 */
export enum CmsdStreamingFormat {
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

