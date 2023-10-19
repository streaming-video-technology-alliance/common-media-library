/**
 * Common Media Streaming Format
 * 
 * @group CMCD
 * @group CMSD
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
