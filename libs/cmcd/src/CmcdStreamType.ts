import type { ValueOf } from '@svta/cml-utils'

/**
 * Common Media Client Data Stream Type
 *
 * @enum
 *
 * @see {@link https://cta-wave.github.io/Resources/common-media-client-data--cta-5004-b.html#stream-type | CTA-5004-A Stream Type}
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
