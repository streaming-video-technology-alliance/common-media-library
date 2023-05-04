/**
 * CMCD Streaming Type
 */
export enum CmcdStreamType {
	/**
	 *  All segments are available – e.g., VOD
	 */
	VOD = 'v',

	/**
	 * Segments become available over time – e.g., LIVE
	 */
	LIVE = 'l',
}
