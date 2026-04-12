import { ECDSA_ALGORITHM, RSA_PSS_ALGORITHM } from './constants.ts'

const KEY_TYPE_OKP = 'OKP'
const KEY_TYPE_RSA = 'RSA'

export function resolveImportAlgorithm(jwk: { kty: string; crv: string; alg?: string }): AlgorithmIdentifier | EcKeyImportParams | RsaHashedImportParams {
	if (jwk.kty === KEY_TYPE_OKP) return { name: jwk.crv }
	if (jwk.kty === KEY_TYPE_RSA) {
		const hash = jwk.alg === 'PS384' ? 'SHA-384' : jwk.alg === 'PS512' ? 'SHA-512' : 'SHA-256'
		return { name: RSA_PSS_ALGORITHM, hash: { name: hash } }
	}
	return { name: ECDSA_ALGORITHM, namedCurve: jwk.crv }
}
