import { decode } from 'cbor-x'
import type { CoseSign1 } from './CoseSign1.ts'

const COSE_SIGN1_TAG_SINGLE_BYTE = 0xd2
const COSE_SIGN1_TAG_TWO_BYTE_FIRST = 0xd8
const COSE_SIGN1_TAG_TWO_BYTE_SECOND = 0x12
const COSE_SIGN1_ARRAY_LENGTH = 4
const COSE_KEY_KID = 4
const COSE_KEY_ALG = 1

function stripCoseTag(bytes: Uint8Array): Uint8Array {
	if (bytes[0] === COSE_SIGN1_TAG_SINGLE_BYTE) return bytes.slice(1)
	if (bytes[0] === COSE_SIGN1_TAG_TWO_BYTE_FIRST && bytes[1] === COSE_SIGN1_TAG_TWO_BYTE_SECOND) return bytes.slice(2)
	return bytes
}

function toUint8Array(value: unknown): Uint8Array {
	if (value instanceof Uint8Array) return value
	if (Array.isArray(value)) return new Uint8Array(value as number[])
	return new Uint8Array()
}

/**
 * Decodes a `COSE_Sign1` structure from raw bytes (RFC 9052).
 *
 * Handles CBOR tag 18 in both single-byte (0xD2) and two-byte (0xD8 0x12) form,
 * and strips null-byte padding that some encoders append.
 *
 * @param coseBytes - Raw COSE_Sign1 bytes, optionally prefixed with CBOR tag 18
 * @returns The decoded COSE_Sign1 structure
 * @throws If the bytes do not represent a valid COSE_Sign1 structure
 *
 * @example
 * {@includeCode ../../test/cose/decodeCoseSign1.test.ts#example}
 *
 * @public
 */
export function decodeCoseSign1(coseBytes: Uint8Array): CoseSign1 {
	try {
		const stripped = stripCoseTag(coseBytes)
		const coseArray = decode(stripped) as unknown

		if (!Array.isArray(coseArray) || coseArray.length !== COSE_SIGN1_ARRAY_LENGTH) {
			throw new Error('Invalid COSE_Sign1 structure: expected array with 4 elements')
		}

		const [protectedRaw, unprotectedRaw, payloadRaw, signatureRaw] = coseArray as unknown[]

		const protectedBytes = toUint8Array(protectedRaw)
		let protectedHeader: Record<number, unknown> = {}
		if (protectedBytes.length > 0) {
			protectedHeader = decode(protectedBytes) as Record<number, unknown>
		}

		const unprotectedHeader = (unprotectedRaw ?? {}) as Record<number, unknown>
		const kidRaw = protectedHeader[COSE_KEY_KID] ?? unprotectedHeader[COSE_KEY_KID] ?? null
		const kid = kidRaw != null ? toUint8Array(kidRaw) : null
		const alg = (protectedHeader[COSE_KEY_ALG] ?? unprotectedHeader[COSE_KEY_ALG] ?? null) as number | null

		return {
			protectedBytes,
			protectedHeader,
			unprotectedHeader,
			payload: toUint8Array(payloadRaw),
			signature: toUint8Array(signatureRaw),
			kid,
			alg,
		}
	}
	catch (error) {
		throw new Error(`Failed to decode COSE_Sign1: ${(error as Error).message}`)
	}
}
