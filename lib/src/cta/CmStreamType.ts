/**
 * Common Media Streaming Type
 * 
 * @group CMCD
 * @group CMSD
 * 
 * @beta
 */
export enum CmStreamType {
	/**
	 *  All segments are available – e.g., VOD
	 */
	VOD = 'v',

	/**
	 * Segments become available over time – e.g., LIVE
	 */
	LIVE = 'l',
}
