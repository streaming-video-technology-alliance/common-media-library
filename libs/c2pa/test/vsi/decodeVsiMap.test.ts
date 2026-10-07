import { decodeVsiMap } from '../../src/vsi/decodeVsiMap.ts'
import { deepStrictEqual, strictEqual, throws } from 'node:assert'
import { describe, it } from 'node:test'
import { encodeCbor } from '../cborTestUtils.ts'

describe('decodeVsiMap', () => {
	// #region example
	it('decodes a valid VSI map with string manifestId', () => {
		const hash = new Uint8Array([0xaa, 0xbb, 0xcc])
		const vsiCbor = encodeCbor({
			sequenceNumber: 7,
			bmffHash: { hash, alg: 'sha256', exclusions: [] },
			manifestId: 'urn:c2pa:12345',
		})
		const result = decodeVsiMap(new Uint8Array(vsiCbor))
		strictEqual(result.sequenceNumber, 7)
		strictEqual(result.manifestId, 'urn:c2pa:12345')
		strictEqual(result.bmffHash.alg, 'SHA-256')
		deepStrictEqual(result.bmffHash.hash, hash)
		deepStrictEqual(result.bmffHash.exclusions, [])
	})
	// #endregion example

	function encodeVsiMapWithSequenceNumber(sequenceNumber: unknown): Uint8Array {
		return new Uint8Array(encodeCbor({
			sequenceNumber,
			bmffHash: { hash: new Uint8Array([0x01]), alg: 'sha256', exclusions: [] },
			manifestId: 'urn:c2pa:12345',
		}))
	}

	it('decodes a sequenceNumber of 2^32 or more to a number', () => {
		// cbor-x decodes a CBOR unsigned integer of 2^32 or more as a BigInt.
		const result = decodeVsiMap(encodeVsiMapWithSequenceNumber(BigInt(2 ** 32)))
		strictEqual(result.sequenceNumber, 2 ** 32)
	})

	it('decodes a sequenceNumber of 2^53 - 1', () => {
		const result = decodeVsiMap(encodeVsiMapWithSequenceNumber(BigInt(2 ** 53) - BigInt(1)))
		strictEqual(result.sequenceNumber, Number.MAX_SAFE_INTEGER)
	})

	// §19.4.2: sequenceNumber is a uint. The library supports values up to 2^53 - 1.
	const NONCONFORMING_SEQUENCE_NUMBERS: readonly (readonly [string, unknown])[] = [
		['a text string', '7'],
		['a negative integer', -1],
		['a negative integer below -2^32', BigInt(-(2 ** 32)) - BigInt(1)],
		['a fraction', 0.5],
		['NaN', NaN],
		['Infinity', Infinity],
		['a BigInt above 2^53 - 1', BigInt(2 ** 53)],
		['a number above 2^53 - 1', 2 ** 53],
	]

	for (const [description, sequenceNumber] of NONCONFORMING_SEQUENCE_NUMBERS) {
		it(`throws when sequenceNumber is ${description}`, () => {
			throws(() => decodeVsiMap(encodeVsiMapWithSequenceNumber(sequenceNumber)), /sequenceNumber/)
		})
	}

	it('names the supported range and the received value in the sequenceNumber error', () => {
		throws(() => decodeVsiMap(encodeVsiMapWithSequenceNumber(BigInt(2 ** 53))), {
			message: 'VSI map sequenceNumber must be an unsigned integer up to 9007199254740991, got 9007199254740992',
		})
		throws(() => decodeVsiMap(encodeVsiMapWithSequenceNumber('7')), {
			message: 'VSI map sequenceNumber must be an unsigned integer up to 9007199254740991, got string',
		})
	})

	it('throws for non-object CBOR input', () => {
		// CBOR integer 42 = 0x18 0x2a
		throws(() => decodeVsiMap(new Uint8Array([0x18, 0x2a])), /VSI map/)
	})

	it('throws when sequenceNumber is missing', () => {
		// CBOR empty map {}
		throws(() => decodeVsiMap(new Uint8Array([0xa0])), /sequenceNumber/)
	})

	it('throws for invalid CBOR input', () => {
		throws(() => decodeVsiMap(new Uint8Array([0xff, 0xff])))
	})

	it('throws when manifestId is not a string', () => {
		const vsiCbor = encodeCbor({
			sequenceNumber: 1,
			bmffHash: { hash: new Uint8Array([0x01]), alg: 'sha256', exclusions: [] },
			manifestId: new Uint8Array([0x01, 0x02]),
		})
		throws(() => decodeVsiMap(new Uint8Array(vsiCbor)), /manifestId/)
	})
})
