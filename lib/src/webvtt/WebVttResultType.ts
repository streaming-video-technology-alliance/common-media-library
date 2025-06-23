import type { ValueOf } from '../utils/ValueOf.js';

/**
 * WebVTT result types.
 *
 * @group WebVTT
 *
 * @beta
 *
 * @enum
 */
export const WebVttResultType = {
	CUE: 'cue',
	REGION: 'region',
	TIMESTAMP_MAP: 'timestampmap',
	STYLE: 'style',
	ERROR: 'error',
} as const;

/**
 * @beta
 */
export type WebVttResultType = ValueOf<typeof WebVttResultType>;
