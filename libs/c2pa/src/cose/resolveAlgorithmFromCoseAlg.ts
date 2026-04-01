const COSE_ALG_ES256 = -7
const COSE_ALG_ES384 = -35
const COSE_ALG_ES512 = -36
const COSE_ALG_EDDSA = -8

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
export function resolveAlgorithmFromCoseAlg(coseAlg: number): AlgorithmIdentifier | EcKeyImportParams {
	switch (coseAlg) {
		case COSE_ALG_ES256:
			return { name: 'ECDSA', namedCurve: 'P-256' }
		case COSE_ALG_ES384:
			return { name: 'ECDSA', namedCurve: 'P-384' }
		case COSE_ALG_ES512:
			return { name: 'ECDSA', namedCurve: 'P-521' }
		case COSE_ALG_EDDSA:
			return { name: 'Ed25519' }
		default:
			throw new Error(`Unsupported COSE algorithm: ${coseAlg}`)
	}
}
