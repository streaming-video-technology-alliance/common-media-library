import { decodeVsiMap } from '../../src/vsi/decodeVsiMap.ts'
import { throws } from 'node:assert'
import { describe, it } from 'node:test'

describe('decodeVsiMap', () => {
	// #region example
	it('throws for non-object CBOR input', () => {
		// CBOR integer 42 = 0x18 0x2a
		throws(() => decodeVsiMap(new Uint8Array([0x18, 0x2a])), /VSI map/)
	})
	// #endregion example

	it('throws when sequenceNumber is missing', () => {
		// CBOR empty map {}
		throws(() => decodeVsiMap(new Uint8Array([0xa0])), /sequenceNumber/)
	})

	it('throws for invalid CBOR input', () => {
		throws(() => decodeVsiMap(new Uint8Array([0xff, 0xff])))
	})
})
