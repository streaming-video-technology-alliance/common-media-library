import type { CoseSign1 } from './CoseSign1.ts'
import { encodeCborByteString } from './buildSigStructure.ts'
import { convertCoseKeyToJwk } from './convertCoseKeyToJwk.ts'
import { decodeCoseSign1 } from './decodeCoseSign1.ts'
import { resolveImportAlgorithm } from './resolveImportAlgorithm.ts'
import { verifyCoseSign1 } from './verifyCoseSign1.ts'
import { hashesEqual } from '../utils.ts'

// §18.25.2 defines a detached payload. The §18.25.3 example has an empty payload. Some signers embed the payload.
async function verifyPayload(coseSign1: CoseSign1, payload: Uint8Array, publicKey: CryptoKey): Promise<boolean> {
	const embeddedPayload = coseSign1.payload
	return (!embeddedPayload?.length || hashesEqual(embeddedPayload, payload)) && verifyCoseSign1(coseSign1, payload, publicKey)
}

/**
 * Verifies a C2PA signer binding (C2PA spec §18.25.2). A signer binding is a
 * `COSE_Sign1` structure that proves the content signer authorized a session key.
 *
 * The `Sig_Structure` payload is the end-entity certificate. The function also accepts
 * a payload that encodes the certificate as a CBOR byte string.
 * The payload field of the `COSE_Sign1` structure must be nil, empty, or equal to
 * the `Sig_Structure` payload that verifies.
 * DER-encoded ECDSA signatures are automatically normalized to raw format.
 *
 * @param signerBindingBytes - Raw `COSE_Sign1` bytes of the signer binding
 * @param sessionCoseKey - COSE public key from the `c2pa.session-keys` assertion
 * @param signerCertBytes - DER-encoded end-entity certificate (from `x5chain`)
 * @returns `true` if the signature and the payload field of the signer binding are valid
 * @throws If the COSE key type is not supported or decoding fails
 *
 * @example
 * {@includeCode ../../test/cose/verifySignerBinding.test.ts#example}
 *
 * @public
 */
export async function verifySignerBinding(
	signerBindingBytes: Uint8Array,
	sessionCoseKey: unknown,
	signerCertBytes: Uint8Array,
): Promise<boolean> {
	const coseSign1 = decodeCoseSign1(signerBindingBytes)
	const jwk = convertCoseKeyToJwk(sessionCoseKey)
	const publicKey = await crypto.subtle.importKey('jwk', jwk as JsonWebKey, resolveImportAlgorithm(jwk), false, ['verify'])
	if (await verifyPayload(coseSign1, signerCertBytes, publicKey)) return true
	return verifyPayload(coseSign1, encodeCborByteString(signerCertBytes), publicKey)
}
