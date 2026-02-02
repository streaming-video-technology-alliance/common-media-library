import type { ValueOf } from '@svta/cml-utils'

/**
 * Common Media Client Data Stream Type
 *
 *
 * @enum
 *
 * @public
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

	/**
	 * Low latency stream
	 */
	LOW_LATENCY: 'll',
} as const

/**
 * @public
 */
export type CmcdStreamType = ValueOf<typeof CmcdStreamType>;
