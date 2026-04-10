import { decodeVsiMap } from '../../src/vsi/decodeVsiMap.ts'
import { deepStrictEqual, strictEqual, throws } from 'node:assert'
import { describe, it } from 'node:test'
import { encode } from 'cbor-x/encode'

describe('decodeVsiMap', () => {
	// #region example
	it('decodes a valid VSI map with string manifestId', () => {
		const hash = new Uint8Array([0xaa, 0xbb, 0xcc])
		const vsiCbor = encode({
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
		const vsiCbor = encode({
			sequenceNumber: 1,
			bmffHash: { hash: new Uint8Array([0x01]), alg: 'sha256', exclusions: [] },
			manifestId: new Uint8Array([0x01, 0x02]),
		})
		throws(() => decodeVsiMap(new Uint8Array(vsiCbor)), /manifestId/)
	})
})
