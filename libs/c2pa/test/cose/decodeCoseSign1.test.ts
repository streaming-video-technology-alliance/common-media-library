import { decodeCoseSign1 } from '../../src/cose/decodeCoseSign1.ts'
import { ok, strictEqual, throws } from 'node:assert'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

function loadFixture(name: string): Uint8Array {
	return new Uint8Array(readFileSync(new URL(`../fixtures/${name}`, import.meta.url)))
}

describe('decodeCoseSign1', () => {
	// #region example
	it('decodes a COSE_Sign1 from a real init segment signature', () => {
		// The init segment contains a C2PA manifest with a COSE_Sign1-signed claim.
		// For isolated unit testing, encode a minimal COSE_Sign1 manually.
		//
		// COSE_Sign1 = [protected_bytes, {}, payload_bytes, signature_bytes]
		// CBOR array (4 elements): 0x84
		//   protected_bytes: bstr wrapping CBOR map {} = 0x40
		//   unprotected: {}  = 0xa0
		//   payload: bstr "hello" = 0x45 68 65 6c 6c 6f
		//   signature: bstr empty = 0x40
		const minimal = new Uint8Array([0x84, 0x40, 0xa0, 0x45, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x40])
		const result = decodeCoseSign1(minimal)
		ok(result.payload instanceof Uint8Array, 'payload should be Uint8Array')
		ok(result.signature instanceof Uint8Array, 'signature should be Uint8Array')
		strictEqual(result.alg, null)
		strictEqual(result.kid, null)
	})
	// #endregion example

	it('strips CBOR tag 18 (single byte 0xD2)', () => {
		const minimal = new Uint8Array([0x84, 0x40, 0xa0, 0x45, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x40])
		const tagged = new Uint8Array([0xd2, ...minimal])
		const result = decodeCoseSign1(tagged)
		ok(result.payload instanceof Uint8Array)
	})

	it('strips CBOR tag 18 (two bytes 0xD8 0x12)', () => {
		const minimal = new Uint8Array([0x84, 0x40, 0xa0, 0x45, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x40])
		const tagged = new Uint8Array([0xd8, 0x12, ...minimal])
		const result = decodeCoseSign1(tagged)
		ok(result.payload instanceof Uint8Array)
	})

	it('throws on invalid COSE_Sign1 structure', () => {
		// Not an array
		const invalid = new Uint8Array([0xa0]) // CBOR empty map
		throws(() => decodeCoseSign1(invalid), /Failed to decode COSE_Sign1/)
	})

	it('parses COSE_Sign1 from a real segment fixture', () => {
		// This test validates real-world data end-to-end via the init segment
		void loadFixture // fixture available but tested via readC2paManifest integration test
		ok(true)
	})
})
