import { encode } from 'cbor-x'
import { convertCoseKeyToJwk } from './convertCoseKeyToJwk.ts'
import { decodeCoseSign1 } from './decodeCoseSign1.ts'
import { resolveImportAlgorithm } from './resolveImportAlgorithm.ts'
import { verifyCoseSign1 } from './verifyCoseSign1.ts'

/**
 * Verifies a C2PA signer binding — a `COSE_Sign1` structure that proves
 * a session key was authorized by the content signer (C2PA spec §18.25.2).
 *
 * The `Sig_Structure` payload is `CBOR(bstr(signerCertBytes))` per the C2PA spec.
 * DER-encoded ECDSA signatures are automatically normalized to raw format.
 *
 * @param signerBindingBytes - Raw `COSE_Sign1` bytes of the signer binding
 * @param sessionCoseKey - COSE public key from the `c2pa.session-keys` assertion
 * @param signerCertBytes - DER-encoded end-entity certificate (from `x5chain`)
 * @returns `true` if the signer binding signature is valid
 * @throws If the COSE key type is not supported or decoding fails
 *
 * @example
 * {@includeCode ../../test/cose/verifySignerBinding.test.ts#example}
 *
 * @internal
 */
export async function verifySignerBinding(
	signerBindingBytes: Uint8Array,
	sessionCoseKey: unknown,
	signerCertBytes: Uint8Array,
): Promise<boolean> {
	const coseSign1 = decodeCoseSign1(signerBindingBytes)
	const jwk = convertCoseKeyToJwk(sessionCoseKey)
	const publicKey = await crypto.subtle.importKey('jwk', jwk as JsonWebKey, resolveImportAlgorithm(jwk), false, ['verify'])
	// Signer binding payload = CBOR(bstr(cert)) per C2PA spec §18.25.2
	const cborCertPayload = encode(signerCertBytes) as Uint8Array
	return verifyCoseSign1(coseSign1, cborCertPayload, publicKey)
}
