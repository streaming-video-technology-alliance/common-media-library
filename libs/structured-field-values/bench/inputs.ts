import type { SfItem, SfToken } from '@svta/cml-structured-field-values'

/**
 * The encoder exports the benchmark uses. A baseline build loaded from a path provides the same shape.
 */
export type EncoderApi = {
	encodeSfDict: (value: Record<string, any> | Map<string, any>, options?: { whitespace?: boolean }) => string;
	encodeSfItem: (value: any, params?: Record<string, any>) => string;
	encodeSfList: (value: any[], options?: { whitespace?: boolean }) => string;
	SfItem: typeof SfItem;
	SfToken: typeof SfToken;
};

export type Input = {
	name: string;
	call: () => string;
};

const COMPACT = { whitespace: false }

/**
 * Builds the benchmark inputs with the classes of the encoder under test, so that its `instanceof` checks match.
 * The CMCD dictionaries have the shape `prepareCmcdData` produces for a version 2 request.
 */
export function makeInputs({ encodeSfDict, encodeSfItem, encodeSfList, SfItem, SfToken }: EncoderApi): Input[] {
	const cmcd: Record<string, any> = {
		bl: 21300,
		br: [new SfItem(1000, { ot: new SfToken('v') })],
		bs: true,
		cid: 'e6f7c1a2-8b6d-4b3e-9f2a-1c2d3e4f5a6b',
		'com.example-hello': 'world',
		d: 4004,
		dl: 21300,
		mtp: 25400,
		nor: ['../video/seg_00042.m4s'],
		ot: new SfToken('v'),
		rtp: 15000,
		sf: new SfToken('d'),
		sid: '6e2fb550-c457-11e9-bb97-0800200c9a66',
		st: new SfToken('v'),
		su: true,
		tb: 6000,
		v: 2,
	}
	const cmcdItems = Object.fromEntries(Object.entries(cmcd).map(([key, value]) => [key, value instanceof SfItem ? value : new SfItem(value)]))
	const cmcdMap = new Map(Object.entries(cmcd))
	const integers = Array.from({ length: 20 }, (_, i) => i * 1000 + 7)
	const wideDict = Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`k${i}`, i * 31]))
	const urls = Array.from({ length: 10 }, (_, i) => `https://cdn.example.com/live/channel-${i}/video/1080p/segment_${String(i).padStart(6, '0')}.m4s?token=abcdef0123456789`)
	const escaped = Array.from({ length: 10 }, (_, i) => `say "hi" ${i} and \\ backslash \\ path "quoted" end`)
	const decimals = Array.from({ length: 20 }, (_, i) => 1.2345 + i * 0.371)
	const bytes = { b: new Uint8Array(32).map((_, i) => i * 7) }
	const params = { a: 1, b: true, c: new SfToken('tok') }

	return [
		{ name: 'CMCD dict, 17 keys, bare values', call: () => encodeSfDict(cmcd, COMPACT) },
		{ name: 'CMCD dict, 17 keys, SfItem values', call: () => encodeSfDict(cmcdItems, COMPACT) },
		{ name: 'CMCD dict, 17 keys, Map', call: () => encodeSfDict(cmcdMap, COMPACT) },
		{ name: 'dict, 100 integer keys', call: () => encodeSfDict(wideDict) },
		{ name: 'list, 20 integers', call: () => encodeSfList(integers) },
		{ name: 'list, 10 URL strings without escapes', call: () => encodeSfList(urls) },
		{ name: 'list, 10 strings with quotes and backslashes', call: () => encodeSfList(escaped) },
		{ name: 'list, 20 decimals', call: () => encodeSfList(decimals) },
		{ name: 'item "abc" with 3 parameters', call: () => encodeSfItem('abc', params) },
		{ name: 'dict, one 32-byte sequence', call: () => encodeSfDict(bytes) },
	]
}
