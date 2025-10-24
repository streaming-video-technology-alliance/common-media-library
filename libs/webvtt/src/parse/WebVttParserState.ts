import type { ValueOf } from '@svta/cml-utils'

export const WebVttParserState = {
	INITIAL: 'INITIAL',
	HEADER: 'HEADER',
	REGION: 'REGION',
	STYLE: 'STYLE',
	NOTE: 'NOTE',
	BLOCKS: 'BLOCKS',
	ID: 'ID',
	CUE: 'CUE',
	CUE_TEXT: 'CUE_EXT',
	BAD_CUE: 'BAD_CUE',
	BAD_WEBVTT: 'BAD_WEBVTT',
} as const

export type WebVttParserState = ValueOf<typeof WebVttParserState>;
