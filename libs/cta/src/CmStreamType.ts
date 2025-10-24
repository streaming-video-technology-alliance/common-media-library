import type { ValueOf } from '@svta/cml-utils'

/**
 * Common Media Stream Type
 *
 * @internal
 */
export const CmStreamType = {
	/**
	 *  All segments are available – e.g., VOD
	 */
	VOD: 'v',

	/**
	 * Segments become available over time – e.g., LIVE
	 */
	LIVE: 'l',
} as const

/**
 * Common Media Stream Type
 *
 * @internal
 */
export type CmStreamType = ValueOf<typeof CmStreamType>;
