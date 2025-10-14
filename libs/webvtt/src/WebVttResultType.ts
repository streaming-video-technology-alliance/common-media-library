import type { ValueOf } from '@svta/cml-utils';

/**
 * WebVTT result types.
 *
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
