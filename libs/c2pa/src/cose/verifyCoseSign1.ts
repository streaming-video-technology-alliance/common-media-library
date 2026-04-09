import type { CoseSign1 } from './CoseSign1.ts'
import { buildSigStructure } from './buildSigStructure.ts'

const ECDSA_ALGORITHM = 'ECDSA'
const ED25519_ALGORITHM = 'Ed25519'
const RSA_PSS_ALGORITHM = 'RSA-PSS'
const DER_SEQUENCE_TAG = 0x30
const DER_INTEGER_TAG = 0x02

const CURVE_COMPONENT_BYTES: Record<string, number> = { 'P-256': 32, 'P-384': 48, 'P-521': 66 }

type EcKeyAlgorithm = KeyAlgorithm & { readonly namedCurve: string }
type RsaHashedKeyAlgorithm = KeyAlgorithm & { readonly hash: { readonly name: string } }

const RSA_PSS_SALT_LENGTH: Record<string, number> = {
	'SHA-256': 32,
	'SHA-384': 48,
	'SHA-512': 64,
}

function getComponentSize(publicKey: CryptoKey): number {
	const curve = (publicKey.algorithm as EcKeyAlgorithm).namedCurve
	const size = CURVE_COMPONENT_BYTES[curve]
	if (!size) throw new Error(`Unsupported EC curve: ${curve}`)
	return size
}

function isDerEncoded(signature: Uint8Array, expectedRawLength: number): boolean {
	return signature.length !== expectedRawLength && signature.length > 2 && signature[0] === DER_SEQUENCE_TAG
}

function parseDerLength(der: Uint8Array, offset: number): { length: number; nextOffset: number } {
	if (offset >= der.length) throw new Error('DER signature: truncated length')
	const firstByte = der[offset]
	if ((firstByte & 0x80) === 0) {
		return { length: firstByte, nextOffset: offset + 1 }
	}
	const numBytes = firstByte & 0x7f
	if (numBytes === 0 || offset + numBytes >= der.length) throw new Error('DER signature: invalid long-form length')
	let length = 0
	for (let i = 1; i <= numBytes; i++) {
		length = (length << 8) | der[offset + i]
	}
	return { length, nextOffset: offset + 1 + numBytes }
}

function extractDerInteger(
	der: Uint8Array,
	offset: number,
): { value: Uint8Array; nextOffset: number } {
	if (der[offset] !== DER_INTEGER_TAG) throw new Error('DER signature: expected INTEGER tag')
	const { length, nextOffset: valueStart } = parseDerLength(der, offset + 1)
	let start = valueStart
	let remaining = length
	if (remaining > 0 && der[start] === 0x00) {
		start++
		remaining--
	}
	return { value: der.slice(start, start + remaining), nextOffset: valueStart + length }
}

function derToRawEcdsaSignature(der: Uint8Array, componentSize: number): Uint8Array {
	if (der[0] !== DER_SEQUENCE_TAG) throw new Error('DER signature: expected SEQUENCE tag')
	const { nextOffset: contentStart } = parseDerLength(der, 1)
	const rResult = extractDerInteger(der, contentStart)
	const sResult = extractDerInteger(der, rResult.nextOffset)

	const rawLength = componentSize * 2
	const raw = new Uint8Array(rawLength)
	raw.set(rResult.value, componentSize - rResult.value.length)
	raw.set(sResult.value, rawLength - sResult.value.length)
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
	if (name === RSA_PSS_ALGORITHM) {
		const hashName = (publicKey.algorithm as RsaHashedKeyAlgorithm).hash.name
		return { name: RSA_PSS_ALGORITHM, saltLength: RSA_PSS_SALT_LENGTH[hashName] ?? 32 }
	}
	throw new Error(`Unsupported public key algorithm: ${name}`)
}

function normalizeSignature(signature: Uint8Array, publicKey: CryptoKey): Uint8Array {
	if (publicKey.algorithm.name !== ECDSA_ALGORITHM) return signature
	const componentSize = getComponentSize(publicKey)
	if (isDerEncoded(signature, componentSize * 2)) {
		return derToRawEcdsaSignature(signature, componentSize)
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
 * Supports `ECDSA` (P-256, P-384, P-521), `Ed25519`, and `RSA-PSS` (PS256, PS384, PS512) keys.
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
