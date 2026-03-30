import type { CoseKeyJwk } from './CoseKeyJwk.ts'

// IANA COSE Key Types (RFC 9053)
const OKP_KEY_TYPE = 1
const EC2_KEY_TYPE = 2

// IANA COSE Elliptic Curves
const EC_CURVE_NAMES: Record<number, string> = { 1: 'P-256', 2: 'P-384', 3: 'P-521' }
const OKP_CURVE_NAMES: Record<number, string> = { 4: 'X25519', 5: 'X448', 6: 'Ed25519', 7: 'Ed448' }

type CoseKeyLike = Map<number, unknown> | Record<number | string, unknown>

function coseGet(key: CoseKeyLike, intKey: number): unknown {
	if (key instanceof Map) return key.get(intKey)
	return (key as Record<number | string, unknown>)[intKey]
}

function toBase64Url(value: unknown): string {
	const bytes = value instanceof Uint8Array ? value : new Uint8Array(value as number[])
	let binary = ''
	for (const byte of bytes) binary += String.fromCharCode(byte)
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Converts a COSE public key (RFC 9052 / IANA COSE Key registry) to JWK format.
 *
 * Supports EC2 keys (P-256, P-384, P-521) and OKP keys (Ed25519, Ed448, X25519, X448).
 * Input may be a `Map\<number, unknown\>` (from CBOR decoders like cbor-x) or a plain
 * object with integer keys.
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
	const key = coseKey as CoseKeyLike
	const kty = coseGet(key, 1)
	const crv = coseGet(key, -1) as number
	const x = coseGet(key, -2)

	if (kty === EC2_KEY_TYPE) {
		const curveName = EC_CURVE_NAMES[crv]
		if (!curveName) throw new Error(`Unsupported EC curve: ${crv}`)
		return { kty: 'EC', crv: curveName, x: toBase64Url(x), y: toBase64Url(coseGet(key, -3)) }
	}

	if (kty === OKP_KEY_TYPE) {
		const curveName = OKP_CURVE_NAMES[crv]
		if (!curveName) throw new Error(`Unsupported OKP curve: ${crv}`)
		return { kty: 'OKP', crv: curveName, x: toBase64Url(x) }
	}

	throw new Error(`Unsupported COSE key type: ${kty}`)
}
