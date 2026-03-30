import type { CoseSign1 } from './CoseSign1.ts'
import { buildSigStructure } from './buildSigStructure.ts'

const ECDSA_ALGORITHM = 'ECDSA'
const ED25519_ALGORITHM = 'Ed25519'
const DER_SEQUENCE_TAG = 0x30
const DER_INTEGER_TAG = 0x02
const RAW_ECDSA_SIGNATURE_COMPONENT_BYTES = 32
const RAW_ECDSA_P256_SIGNATURE_LENGTH = 64

type EcKeyAlgorithm = KeyAlgorithm & { readonly namedCurve: string }

function isDerEncoded(signature: Uint8Array): boolean {
	return signature.length > 2 && signature[0] === DER_SEQUENCE_TAG
}

function extractDerInteger(
	der: Uint8Array,
	offset: number,
): { value: Uint8Array; nextOffset: number } {
	if (der[offset] !== DER_INTEGER_TAG) throw new Error('DER signature: expected INTEGER tag')
	let length = der[offset + 1]
	let valueStart = offset + 2
	if (der[valueStart] === 0x00) {
		// Leading zero padding — strip it
		valueStart++
		length--
	}
	return { value: der.slice(valueStart, valueStart + length), nextOffset: valueStart + length }
}

function derToRawEcdsaSignature(der: Uint8Array): Uint8Array {
	if (der[0] !== DER_SEQUENCE_TAG) throw new Error('DER signature: expected SEQUENCE tag')
	const rResult = extractDerInteger(der, 2)
	const sResult = extractDerInteger(der, rResult.nextOffset)

	const raw = new Uint8Array(RAW_ECDSA_P256_SIGNATURE_LENGTH)
	raw.set(rResult.value, RAW_ECDSA_SIGNATURE_COMPONENT_BYTES - rResult.value.length)
	raw.set(sResult.value, RAW_ECDSA_P256_SIGNATURE_LENGTH - sResult.value.length)
	return raw
}

function resolveVerifyAlgorithm(publicKey: CryptoKey) {
	const { name } = publicKey.algorithm
	if (name === ED25519_ALGORITHM) return { name: ED25519_ALGORITHM }
	if (name === ECDSA_ALGORITHM) {
		const curve = (publicKey.algorithm as EcKeyAlgorithm).namedCurve
		const hash = curve === 'P-384' ? 'SHA-384' : curve === 'P-521' ? 'SHA-512' : 'SHA-256'
		return { name: ECDSA_ALGORITHM, hash: { name: hash } }
	}
	throw new Error(`Unsupported public key algorithm: ${name}`)
}

function normalizeSignature(signature: Uint8Array, publicKey: CryptoKey): Uint8Array {
	if (publicKey.algorithm.name === ECDSA_ALGORITHM && isDerEncoded(signature)) {
		return derToRawEcdsaSignature(signature)
	}
	return signature
}

/**
 * Verifies a `COSE_Sign1` signature using a provided `CryptoKey` (RFC 9052 §4.4).
 *
 * Builds the `Sig_Structure` from the protected header and payload, normalizes
 * DER-encoded ECDSA signatures to raw format if needed, and delegates
 * verification to the WebCrypto API.
 *
 * Supports `Ed25519` and `ECDSA` keys (P-256, P-384, P-521).
 *
 * @param coseSign1 - Decoded COSE_Sign1 structure (from {@link decodeCoseSign1})
 * @param payload - Payload bytes to verify. May differ from `coseSign1.payload` for detached payloads.
 * @param publicKey - Imported public key for verification
 * @returns `true` if the signature is valid
 * @throws If the key algorithm is not supported
 *
 * @example
 * {@includeCode ../../test/cose/verifyCoseSign1.test.ts#example}
 *
 * @public
 */
export async function verifyCoseSign1(
	coseSign1: CoseSign1,
	payload: Uint8Array,
	publicKey: CryptoKey,
): Promise<boolean> {
	const sigStructure = buildSigStructure(coseSign1.protectedBytes, payload)
	const algorithm = resolveVerifyAlgorithm(publicKey)
	const signature = normalizeSignature(coseSign1.signature, publicKey)
	return crypto.subtle.verify(algorithm, publicKey, signature, sigStructure)
}
