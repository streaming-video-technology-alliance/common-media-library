/**
 * Common Media Stream Type
 *
 * @internal
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
