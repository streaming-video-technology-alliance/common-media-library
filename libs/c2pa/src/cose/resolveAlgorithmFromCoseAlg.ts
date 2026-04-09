const COSE_ALG_ES256 = -7
const COSE_ALG_ES384 = -35
const COSE_ALG_ES512 = -36
const COSE_ALG_EDDSA = -8
const COSE_ALG_PS256 = -37
const COSE_ALG_PS384 = -38
const COSE_ALG_PS512 = -39

type CoseAlgorithm = AlgorithmIdentifier | EcKeyImportParams | RsaHashedImportParams

const COSE_ALGORITHM_MAP = new Map<number, CoseAlgorithm>([
	[COSE_ALG_ES256, { name: 'ECDSA', namedCurve: 'P-256' }],
	[COSE_ALG_ES384, { name: 'ECDSA', namedCurve: 'P-384' }],
	[COSE_ALG_ES512, { name: 'ECDSA', namedCurve: 'P-521' }],
	[COSE_ALG_EDDSA, { name: 'Ed25519' }],
	[COSE_ALG_PS256, { name: 'RSA-PSS', hash: { name: 'SHA-256' } }],
	[COSE_ALG_PS384, { name: 'RSA-PSS', hash: { name: 'SHA-384' } }],
	[COSE_ALG_PS512, { name: 'RSA-PSS', hash: { name: 'SHA-512' } }],
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
