import { deepStrictEqual, ok, strictEqual, throws } from 'node:assert'
import { describe, it } from 'node:test'
import { decodeCoseSign1 } from '../../src/cose/decodeCoseSign1.ts'

// COSE_Sign1 = [protected_bytes, {}, payload_bytes, signature_bytes]
// 0x84 = 4-element array, 0x40 = empty bstr, 0xa0 = empty map, 0x45 68 65 6c 6c 6f = bstr "hello", 0x40 = empty bstr
const UNTAGGED = Uint8Array.of(0x84, 0x40, 0xa0, 0x45, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x40)
const PAYLOAD = Uint8Array.of(0x68, 0x65, 0x6c, 0x6c, 0x6f)

describe('decodeCoseSign1', () => {
	// #region example
	it('decodes a minimal COSE_Sign1_Tagged', () => {
		// CBOR tag 18 (COSE_Sign1_Tagged): 0xd2
		// COSE_Sign1 = [protected_bytes, {}, payload_bytes, signature_bytes]
		// CBOR array (4 elements): 0x84
		//   protected_bytes: bstr wrapping CBOR map {} = 0x40
		//   unprotected: {}  = 0xa0
		//   payload: bstr "hello" = 0x45 68 65 6c 6c 6f
		//   signature: bstr empty = 0x40
		const minimal = new Uint8Array([0xd2, 0x84, 0x40, 0xa0, 0x45, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x40])
		const result = decodeCoseSign1(minimal)
		ok(result.payload instanceof Uint8Array, 'payload should be Uint8Array')
		ok(result.signature instanceof Uint8Array, 'signature should be Uint8Array')
		strictEqual(result.alg, null)
		strictEqual(result.kid, null)
	})
	// #endregion example

	it('decodes CBOR tag 18 in its one, two, and three byte forms', () => {
		for (const tag of [[0xd2], [0xd8, 0x12], [0xd9, 0x00, 0x12]]) {
			const result = decodeCoseSign1(Uint8Array.of(...tag, ...UNTAGGED))
			deepStrictEqual(result.payload, PAYLOAD, tag.join(' '))
		}
	})

	it('throws on a COSE_Sign1 without CBOR tag 18', () => {
		throws(() => decodeCoseSign1(UNTAGGED), /Failed to decode COSE_Sign1/)
	})

	it('throws on CBOR tag 18 around a value that is not an array', () => {
		// d2 a0: tag 18 around an empty map
		throws(() => decodeCoseSign1(Uint8Array.of(0xd2, 0xa0)), /Failed to decode COSE_Sign1/)
	})

	it('throws on non-Uint8Array fields in COSE_Sign1', () => {
		// 18([protected="", {}, "hello", ""]): 0x65 = text(5) "hello" instead of a byte string
		const withTextPayload = new Uint8Array([0xd2, 0x84, 0x40, 0xa0, 0x65, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x40])
		throws(() => decodeCoseSign1(withTextPayload), /Failed to decode COSE_Sign1/)
	})

	it('throws on a payload that is a CBOR array', () => {
		// 18([protected="", {}, [], ""]): 0x80 = an empty array instead of a byte string
		const withArrayPayload = Uint8Array.of(0xd2, 0x84, 0x40, 0xa0, 0x80, 0x40)
		throws(() => decodeCoseSign1(withArrayPayload), /Failed to decode COSE_Sign1/)
	})
})
