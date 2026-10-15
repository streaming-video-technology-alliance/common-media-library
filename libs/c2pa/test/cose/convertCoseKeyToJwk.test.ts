import { convertCoseKeyToJwk } from '../../src/cose/convertCoseKeyToJwk.ts'
import { ok, strictEqual, throws } from 'node:assert'
import { describe, it } from 'node:test'

// Each COSE key has the shape that the CBOR reader decodes: a plain object with the integer labels as keys.
describe('convertCoseKeyToJwk', () => {
	// #region example
	it('converts an EC2 P-256 COSE key to JWK', () => {
		const x = new Uint8Array(32).fill(0xaa)
		const y = new Uint8Array(32).fill(0xbb)
		// kty=2 (EC2), crv=1 (P-256), x=-2, y=-3
		const coseKey = {
			1: 2,     // kty: EC2
			[-1]: 1,  // crv: P-256
			[-2]: x,  // x
			[-3]: y,  // y
		}
		const jwk = convertCoseKeyToJwk(coseKey)
		strictEqual(jwk.kty, 'EC')
		strictEqual(jwk.crv, 'P-256')
		ok(typeof jwk.x === 'string' && jwk.x.length > 0)
		ok(typeof jwk.y === 'string' && jwk.y.length > 0)
	})
	// #endregion example

	it('converts an OKP Ed25519 COSE key to JWK', () => {
		const x = new Uint8Array(32).fill(0xcc)
		const coseKey = {
			1: 1,     // kty: OKP
			[-1]: 6,  // crv: Ed25519
			[-2]: x,  // x
		}
		const jwk = convertCoseKeyToJwk(coseKey)
		strictEqual(jwk.kty, 'OKP')
		strictEqual(jwk.crv, 'Ed25519')
		ok(typeof jwk.x === 'string')
		strictEqual(jwk.y, undefined)
	})

	it('converts an EC2 P-384 COSE key to JWK', () => {
		const x = new Uint8Array(48).fill(0x11)
		const y = new Uint8Array(48).fill(0x22)
		const jwk = convertCoseKeyToJwk({ 1: 2, [-1]: 2, [-2]: x, [-3]: y })
		strictEqual(jwk.kty, 'EC')
		strictEqual(jwk.crv, 'P-384')
	})

	it('throws for an unsupported key type', () => {
		throws(() => convertCoseKeyToJwk({ 1: 99 }), /Unsupported COSE key type/)
	})

	it('throws for an unsupported EC curve', () => {
		throws(() => convertCoseKeyToJwk({ 1: 2, [-1]: 99 }), /Unsupported EC curve/)
	})

	it('throws for an OKP x coordinate that is not a byte string', () => {
		throws(() => convertCoseKeyToJwk({ 1: 1, [-1]: 6, [-2]: [1, 2, 3] }), /x coordinate/)
	})
})
