/**
 * Common Media Server Data Stream Type
 *
 * @group CMSD
 *
 * @beta
 */
export enum CmsdStreamType {
	/**
	 *  All segments are available – e.g., VOD
	 */
	VOD = 'v',

	/**
	 * Segments become available over time – e.g., LIVE
	 */
	LIVE = 'l',
}

