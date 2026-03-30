import { buildSigStructure } from '../../src/cose/buildSigStructure.ts'
import { ok, strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

describe('buildSigStructure', () => {
	// #region example
	it('builds a valid Sig_Structure for empty inputs', () => {
		const protectedBytes = new Uint8Array(0)
		const payload = new Uint8Array([0x01, 0x02, 0x03])
		const result = buildSigStructure(protectedBytes, payload)
		ok(result instanceof Uint8Array)
		// CBOR array(4) = 0x84
		strictEqual(result[0], 0x84)
		// 'Signature1' text = 0x6a (0x60 + 10)
		strictEqual(result[1], 0x6a)
	})
	// #endregion example

	it('starts with CBOR array header 0x84', () => {
		const result = buildSigStructure(new Uint8Array(1), new Uint8Array(1))
		strictEqual(result[0], 0x84)
	})

	it('uses default empty externalAad when not provided', () => {
		const result1 = buildSigStructure(new Uint8Array(4), new Uint8Array(4))
		const result2 = buildSigStructure(new Uint8Array(4), new Uint8Array(4), new Uint8Array(0))
		strictEqual(result1.length, result2.length)
		ok(result1.every((b, i) => b === result2[i]))
	})

	it('produces different output when protectedBytes differ', () => {
		const a = buildSigStructure(new Uint8Array([0x01]), new Uint8Array([0x00]))
		const b = buildSigStructure(new Uint8Array([0x02]), new Uint8Array([0x00]))
		ok(!a.every((byte, i) => byte === b[i]))
	})

	it('handles large payload (> 255 bytes)', () => {
		const payload = new Uint8Array(300).fill(0xaa)
		const result = buildSigStructure(new Uint8Array(0), payload)
		ok(result instanceof Uint8Array)
		ok(result.length > 300)
	})
})
