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
		deepStrictEqual(parseExclusions([{ xpath: '/ftyp', data: null, length: null }, { xpath: '/uuid', data: [] }]), [{ xpath: '/ftyp' }, { xpath: '/uuid' }])
	})

	// Each value breaks the CDDL of the exclusions field: an array of maps with an xpath text string,
	// and data constraints with a uint offset and a byte string value.
	const NONCONFORMING_EXCLUSIONS: readonly (readonly [string, unknown])[] = [
		['an exclusions field that is not an array', { xpath: '/emsg' }],
		['an exclusion that is not a map', ['/emsg']],
		['an exclusion without an xpath text string', [{ xpath: 1 }]],
		['a data field that is not an array', [{ xpath: '/uuid', data: { offset: 8, value: Uint8Array.of(1) } }]],
		['a constraint that is not a map', [{ xpath: '/uuid', data: [8] }]],
		['a constraint without an offset', [{ xpath: '/uuid', data: [{ value: Uint8Array.of(1) }] }]],
		['a constraint offset that is negative', [{ xpath: '/uuid', data: [{ offset: -8, value: Uint8Array.of(1) }] }]],
		['a constraint offset that is a text string', [{ xpath: '/uuid', data: [{ offset: '8', value: Uint8Array.of(1) }] }]],
		['a constraint without a value', [{ xpath: '/uuid', data: [{ offset: 8 }] }]],
		['a constraint value that is an array of integers', [{ xpath: '/uuid', data: [{ offset: 8, value: [1] }] }]],
		['a constraint value that is a text string', [{ xpath: '/uuid', data: [{ offset: 8, value: 'x' }] }]],
	]

	for (const [description, exclusions] of NONCONFORMING_EXCLUSIONS) {
		it(`returns null for ${description}`, () => {
			strictEqual(parseExclusions(exclusions), null)
		})
	}
})
