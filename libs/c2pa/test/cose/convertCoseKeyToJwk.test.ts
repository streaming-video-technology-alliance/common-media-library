import { convertCoseKeyToJwk } from '../../src/cose/convertCoseKeyToJwk.ts'
import { ok, strictEqual, throws } from 'node:assert'
import { describe, it } from 'node:test'

describe('convertCoseKeyToJwk', () => {
	// #region example
	it('converts an EC2 P-256 COSE key (Map form) to JWK', () => {
		const x = new Uint8Array(32).fill(0xaa)
		const y = new Uint8Array(32).fill(0xbb)
		// kty=2 (EC2), crv=1 (P-256), x=-2, y=-3
		const coseKey = new Map<number, unknown>([
			[1, 2],   // kty: EC2
			[-1, 1],  // crv: P-256
			[-2, x],  // x
			[-3, y],  // y
		])
		const jwk = convertCoseKeyToJwk(coseKey)
		strictEqual(jwk.kty, 'EC')
		strictEqual(jwk.crv, 'P-256')
		ok(typeof jwk.x === 'string' && jwk.x.length > 0)
		ok(typeof jwk.y === 'string' && jwk.y.length > 0)
	})
	// #endregion example

	it('converts an OKP Ed25519 COSE key (Map form) to JWK', () => {
		const x = new Uint8Array(32).fill(0xcc)
		const coseKey = new Map<number, unknown>([
			[1, 1],   // kty: OKP
			[-1, 6],  // crv: Ed25519
			[-2, x],  // x
		])
		const jwk = convertCoseKeyToJwk(coseKey)
		strictEqual(jwk.kty, 'OKP')
		strictEqual(jwk.crv, 'Ed25519')
		ok(typeof jwk.x === 'string')
		strictEqual(jwk.y, undefined)
	})

	it('converts a plain-object COSE key', () => {
		const x = new Uint8Array(32).fill(0x11)
		const y = new Uint8Array(32).fill(0x22)
		// Object with mixed keys — kty from int key 1
		const coseMap = new Map<number, unknown>([[1, 2], [-1, 2], [-2, x], [-3, y]])
		const jwk = convertCoseKeyToJwk(coseMap)
		strictEqual(jwk.kty, 'EC')
		strictEqual(jwk.crv, 'P-384')
	})

	it('throws for an unsupported key type', () => {
		const coseKey = new Map([[1, 99]])
		throws(() => convertCoseKeyToJwk(coseKey), /Unsupported COSE key type/)
	})

	it('throws for an unsupported EC curve', () => {
		const coseKey = new Map([[1, 2], [-1, 99]])
		throws(() => convertCoseKeyToJwk(coseKey), /Unsupported EC curve/)
	})
})
