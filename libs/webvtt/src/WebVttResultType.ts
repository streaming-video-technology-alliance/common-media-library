import type { ValueOf } from '@svta/cml-utils'

/**
 * WebVTT result types.
 *
 * @public
 *
 * @enum
 */
export const WebVttResultType = {
	CUE: 'cue',
	REGION: 'region',
	TIMESTAMP_MAP: 'timestampmap',
	STYLE: 'style',
	ERROR: 'error',
} as const

/**
 * @public
 */
export type WebVttResultType = ValueOf<typeof WebVttResultType>;
