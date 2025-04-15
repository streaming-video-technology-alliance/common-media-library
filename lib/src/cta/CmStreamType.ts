import type { ValueOf } from '../utils/ValueOf.ts';

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
} as const;

/**
 * Common Media Stream Type
 *
 * @internal
 * @see {@link CmcdEncoding}
 */
export type CmStreamType = ValueOf<typeof CmStreamType>;
