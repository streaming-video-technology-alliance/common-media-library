/**
 * Common Media Client Data Stream Type
 *
 * @group CMCD
 *
 * @beta
 */
export const CmcdStreamType = {
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
 * Common Media Client Data Stream Type
 *
 * @group CMCD
 *
 * @see {@link CmcdStreamType}
 *
 * @beta
 */
export type CmcdStreamType = typeof CmcdStreamType[keyof typeof CmcdStreamType];
