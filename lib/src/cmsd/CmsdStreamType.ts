/**
 * Common Media Server Data Stream Type
 *
 * @group CMSD
 *
 * @beta
 */
export const CmsdStreamType = {
	/**
	 *  All segments are available – e.g., VOD
	 */
	VOD: 'v',

	/**
	 * Segments become available over time – e.g., LIVE
	 */
	LIVE: 'l',
} as const;

/**
 * Common Media Server Data Stream Type
 *
 * @group CMSD
 * @see {@link CmsdStreamType}
 *
 * @beta
 */
export type CmsdStreamType = typeof CmsdStreamType[keyof typeof CmsdStreamType];
