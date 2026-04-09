import {
	CURVE_P256, 
	CURVE_P384, 
	CURVE_P521,
	ECDSA_ALGORITHM, 
	ED25519_ALGORITHM, 
	RSA_PSS_ALGORITHM,
	HASH_SHA256, 
	HASH_SHA384, 
	HASH_SHA512,
} from './constants.ts'

const COSE_ALG_ES256 = -7
const COSE_ALG_ES384 = -35
const COSE_ALG_ES512 = -36
const COSE_ALG_EDDSA = -8
const COSE_ALG_PS256 = -37
const COSE_ALG_PS384 = -38
const COSE_ALG_PS512 = -39

type CoseAlgorithm = AlgorithmIdentifier | EcKeyImportParams | RsaHashedImportParams

const COSE_ALGORITHM_MAP = new Map<number, CoseAlgorithm>([
	[COSE_ALG_ES256, { name: ECDSA_ALGORITHM, namedCurve: CURVE_P256 }],
	[COSE_ALG_ES384, { name: ECDSA_ALGORITHM, namedCurve: CURVE_P384 }],
	[COSE_ALG_ES512, { name: ECDSA_ALGORITHM, namedCurve: CURVE_P521 }],
	[COSE_ALG_EDDSA, { name: ED25519_ALGORITHM }],
	[COSE_ALG_PS256, { name: RSA_PSS_ALGORITHM, hash: { name: HASH_SHA256 } }],
	[COSE_ALG_PS384, { name: RSA_PSS_ALGORITHM, hash: { name: HASH_SHA384 } }],
	[COSE_ALG_PS512, { name: RSA_PSS_ALGORITHM, hash: { name: HASH_SHA512 } }],
])

/**
 * Maps a COSE algorithm number (from a COSE_Sign1 protected header) to the
 * WebCrypto algorithm identifier needed for `crypto.subtle.importKey('spki', ...)`.
 *
 * @param coseAlg - COSE algorithm identifier (e.g. -7 for ES256)
 * @returns WebCrypto algorithm identifier
 * @throws If the COSE algorithm is not supported
 *
 * @internal
 */
export function resolveAlgorithmFromCoseAlg(coseAlg: number): CoseAlgorithm {
	const algorithm = COSE_ALGORITHM_MAP.get(coseAlg)
	if (!algorithm) {
		throw new Error(`Unsupported COSE algorithm: ${coseAlg}`)
	}
	return algorithm
}
