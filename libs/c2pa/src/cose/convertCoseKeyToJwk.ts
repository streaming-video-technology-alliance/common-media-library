import type { CoseKeyJwk } from './CoseKeyJwk.ts'

// IANA COSE Key Types (RFC 9053)
const OKP_KEY_TYPE = 1
const EC2_KEY_TYPE = 2

// IANA COSE Elliptic Curves
const EC_CURVE_NAMES: Record<number, string> = { 1: 'P-256', 2: 'P-384', 3: 'P-521' }
const OKP_CURVE_NAMES: Record<number, string> = { 4: 'X25519', 5: 'X448', 6: 'Ed25519', 7: 'Ed448' }

type CoseKey = Record<number | string, unknown>

function toBase64Url(bytes: Uint8Array): string {
	let binary = ''
	for (const byte of bytes) binary += String.fromCharCode(byte)
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Converts a COSE public key (RFC 9052 / IANA COSE Key registry) to JWK format.
 *
 * Supports EC2 keys (P-256, P-384, P-521) and OKP keys (Ed25519, Ed448, X25519, X448).
 * The input is a plain object whose keys are the integer labels of the COSE key, as the CBOR reader decodes a map.
 *
 * @param coseKey - COSE key structure as decoded from a C2PA `c2pa.session-keys` assertion
 * @returns JWK representation of the public key
 * @throws If the key type or curve is not supported
 *
 * @example
 * {@includeCode ../../test/cose/convertCoseKeyToJwk.test.ts#example}
 *
 * @public
 */
export function convertCoseKeyToJwk(coseKey: unknown): CoseKeyJwk {
	const key = coseKey as CoseKey
	const kty = key[1]
	const crv = key[-1] as number
	const x = key[-2]

	if (kty === EC2_KEY_TYPE) {
		const curveName = EC_CURVE_NAMES[crv]
		if (!curveName) throw new Error(`Unsupported EC curve: ${crv}`)
		const y = key[-3]
		if (!(x instanceof Uint8Array)) throw new Error('EC2 key missing or invalid x coordinate')
		if (!(y instanceof Uint8Array)) throw new Error('EC2 key missing or invalid y coordinate')
		return { kty: 'EC', crv: curveName, x: toBase64Url(x), y: toBase64Url(y) }
	}

	if (kty === OKP_KEY_TYPE) {
		const curveName = OKP_CURVE_NAMES[crv]
		if (!curveName) throw new Error(`Unsupported OKP curve: ${crv}`)
		if (!(x instanceof Uint8Array)) throw new Error('OKP key missing or invalid x coordinate')
		return { kty: 'OKP', crv: curveName, x: toBase64Url(x) }
	}

	throw new Error(`Unsupported COSE key type: ${kty}`)
}
