import { parseExclusions } from '../../src/bmff/parseExclusions.ts'
import { deepStrictEqual, strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

describe('parseExclusions', () => {
	// #region example
	it('parses an exclusion with a data constraint', () => {
		const value = Uint8Array.of(0xaa, 0xbb)
		const exclusions = parseExclusions([{ xpath: '/emsg' }, { xpath: '/uuid', data: [{ offset: 8, value }] }])
		deepStrictEqual(exclusions, [{ xpath: '/emsg' }, { xpath: '/uuid', data: [{ offset: 8, value }] }])
	})
	// #endregion example

	it('returns no exclusions for an absent field', () => {
		deepStrictEqual(parseExclusions(undefined), [])
	})

	it('returns no exclusions for a null field, which c2pa-rs writes for an absent field', () => {
		deepStrictEqual(parseExclusions(null), [])
	})

	it('returns an unconditional exclusion for a null or empty data field', () => {
		deepStrictEqual(
			parseExclusions([
				{ xpath: '/ftyp', data: null, length: null },
				{ xpath: '/uuid', data: [] },
			]),
			[{ xpath: '/ftyp' }, { xpath: '/uuid' }],
		)
	})

	it('parses every optional field of the §18.6.2 exclusions-map', () => {
		const exclusion = {
			xpath: '/moov/trak[2]/udta',
			length: 32,
			data: [{ offset: 8, value: Uint8Array.of(0xaa) }],
			subset: [
				{ offset: 8, length: 4 },
				{ offset: 16, length: 0 },
			],
			version: 1,
			flags: Uint8Array.of(0, 0, 1),
			exact: false,
		}
		deepStrictEqual(parseExclusions([exclusion]), [exclusion])
	})

	it('treats a null optional field as absent', () => {
		const exclusion = {
			xpath: '/moov',
			length: null,
			data: null,
			subset: null,
			version: null,
			flags: null,
			exact: null,
		}
		deepStrictEqual(parseExclusions([exclusion]), [{ xpath: '/moov' }])
	})

	// The CDDL allows exact only with flags. Without flags the field has no effect.
	it('drops an exact field without flags', () => {
		deepStrictEqual(parseExclusions([{ xpath: '/moov', exact: false }]), [{ xpath: '/moov' }])
	})

	for (const xpath of ['/moov', '/moov[1]', '/moov/trak[12]/udta', '/free/url ']) {
		it(`accepts the xpath ${JSON.stringify(xpath)}`, () => {
			deepStrictEqual(parseExclusions([{ xpath }]), [{ xpath }])
		})
	}

	// Each xpath breaks the §18.6.2 grammar: '/' nodes, where a node is a 4cc with an optional [integer] and the integer has no leading zero.
	for (const xpath of ['moov', '/', '/mo', '/moov/', '//moov', '/moov[0]', '/moov[01]', '/moov[1', '/moov[a]']) {
		it(`returns null for the xpath ${JSON.stringify(xpath)}`, () => {
			strictEqual(parseExclusions([{ xpath }]), null)
		})
	}

	// Each value breaks the CDDL of the exclusions field: an array of maps with an xpath text string,
	// data constraints with a uint offset and a byte string value, a uint length, subset entries with a
	// uint offset and length, a version of 0 to 255, 3 flag bytes, and a boolean exact.
	const NONCONFORMING_EXCLUSIONS: readonly (readonly [string, unknown])[] = [
		['an exclusions field that is not an array', { xpath: '/emsg' }],
		['an exclusion that is not a map', ['/emsg']],
		['an exclusion without an xpath text string', [{ xpath: 1 }]],
		['a data field that is not an array', [{ xpath: '/uuid', data: { offset: 8, value: Uint8Array.of(1) } }]],
		['a constraint that is not a map', [{ xpath: '/uuid', data: [8] }]],
		['a constraint without an offset', [{ xpath: '/uuid', data: [{ value: Uint8Array.of(1) }] }]],
		['a constraint offset that is negative', [{ xpath: '/uuid', data: [{ offset: -8, value: Uint8Array.of(1) }] }]],
		[
			'a constraint offset that is a text string',
			[{ xpath: '/uuid', data: [{ offset: '8', value: Uint8Array.of(1) }] }],
		],
		['a constraint without a value', [{ xpath: '/uuid', data: [{ offset: 8 }] }]],
		['a constraint value that is an array of integers', [{ xpath: '/uuid', data: [{ offset: 8, value: [1] }] }]],
		['a constraint value that is a text string', [{ xpath: '/uuid', data: [{ offset: 8, value: 'x' }] }]],
		['a length that is negative', [{ xpath: '/moov', length: -1 }]],
		['a length that is a text string', [{ xpath: '/moov', length: '32' }]],
		['a version above 255', [{ xpath: '/meta', version: 256 }]],
		['a version that is negative', [{ xpath: '/meta', version: -1 }]],
		['a version that is a text string', [{ xpath: '/meta', version: '1' }]],
		['flags with 2 bytes', [{ xpath: '/meta', flags: Uint8Array.of(0, 1) }]],
		['flags with 4 bytes', [{ xpath: '/meta', flags: Uint8Array.of(0, 0, 0, 1) }]],
		['flags that is an array of integers', [{ xpath: '/meta', flags: [0, 0, 1] }]],
		['an exact field that is not a boolean', [{ xpath: '/meta', flags: Uint8Array.of(0, 0, 1), exact: 1 }]],
		['a subset field that is not an array', [{ xpath: '/moov', subset: { offset: 8, length: 4 } }]],
		['a subset field that is an empty array', [{ xpath: '/moov', subset: [] }]],
		['a subset entry that is not a map', [{ xpath: '/moov', subset: [8] }]],
		['a subset entry without a length', [{ xpath: '/moov', subset: [{ offset: 8 }] }]],
		['a subset entry offset that is negative', [{ xpath: '/moov', subset: [{ offset: -8, length: 4 }] }]],
		['a subset entry length that is a text string', [{ xpath: '/moov', subset: [{ offset: 8, length: '4' }] }]],
		[
			'subset offsets that decrease',
			[
				{
					xpath: '/moov',
					subset: [
						{ offset: 16, length: 4 },
						{ offset: 8, length: 4 },
					],
				},
			],
		],
		[
			'subset offsets that repeat',
			[
				{
					xpath: '/moov',
					subset: [
						{ offset: 8, length: 4 },
						{ offset: 8, length: 4 },
					],
				},
			],
		],
		[
			'subset ranges that overlap',
			[
				{
					xpath: '/moov',
					subset: [
						{ offset: 8, length: 8 },
						{ offset: 12, length: 4 },
					],
				},
			],
		],
		[
			'a subset length of 0 before the last entry',
			[
				{
					xpath: '/moov',
					subset: [
						{ offset: 8, length: 0 },
						{ offset: 16, length: 4 },
					],
				},
			],
		],
	]

	for (const [description, exclusions] of NONCONFORMING_EXCLUSIONS) {
		it(`returns null for ${description}`, () => {
			strictEqual(parseExclusions(exclusions), null)
		})
	}
})
