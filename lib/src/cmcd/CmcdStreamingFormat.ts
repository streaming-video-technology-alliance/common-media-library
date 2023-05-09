/**
 * CMCD Streaming Format
 * 
 * @group CMCD
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
