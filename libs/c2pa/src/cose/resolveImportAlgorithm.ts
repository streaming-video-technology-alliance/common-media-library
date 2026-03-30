const KEY_TYPE_OKP = 'OKP'

export function resolveImportAlgorithm(jwk: { kty: string; crv: string }): AlgorithmIdentifier | EcKeyImportParams {
	return jwk.kty === KEY_TYPE_OKP ? { name: jwk.crv } : { name: 'ECDSA', namedCurve: jwk.crv }
}
