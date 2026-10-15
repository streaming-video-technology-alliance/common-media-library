import { CborTag, decodeCbor } from '../cbor/readCborItem.ts'
import type { CoseSign1 } from './CoseSign1.ts'

const COSE_SIGN1_TAG = 18
const COSE_SIGN1_ARRAY_LENGTH = 4
const COSE_KEY_KID = 4
const COSE_KEY_ALG = 1

type CoseHeader = Record<number | string, unknown>

function toUint8Array(value: unknown): Uint8Array {
	if (value instanceof Uint8Array) return value
	throw new Error(`Expected a byte string, got ${typeof value}`)
}

/**
 * Decodes a `COSE_Sign1_Tagged` structure from raw bytes (RFC 9052 section 4.2).
 *
 * The bytes must carry CBOR tag 18 in any encoding length (C2PA section 14).
 *
 * @param coseBytes - Raw `COSE_Sign1_Tagged` bytes
 * @returns The decoded COSE_Sign1 structure
 * @throws If the bytes do not represent a `COSE_Sign1` structure with CBOR tag 18
 *
 * @example
 * {@includeCode ../../test/cose/decodeCoseSign1.test.ts#example}
 *
 * @internal
 */
export function decodeCoseSign1(coseBytes: Uint8Array): CoseSign1 {
	try {
		const tagged = decodeCbor(coseBytes)
		if (!(tagged instanceof CborTag) || tagged.tag !== COSE_SIGN1_TAG) {
			throw new Error('Invalid COSE_Sign1 structure: expected CBOR tag 18')
		}

		const coseArray = tagged.value
		if (!Array.isArray(coseArray) || coseArray.length !== COSE_SIGN1_ARRAY_LENGTH) {
			throw new Error('Invalid COSE_Sign1 structure: expected array with 4 elements')
		}

		const [protectedRaw, unprotectedRaw, payloadRaw, signatureRaw] = coseArray as unknown[]

		const protectedBytes = toUint8Array(protectedRaw)
		let protectedHeader: CoseHeader = {}
		if (protectedBytes.length > 0) {
			protectedHeader = decodeCbor(protectedBytes) as CoseHeader
		}

		const unprotectedHeader = (unprotectedRaw ?? {}) as CoseHeader
		const kidRaw = protectedHeader[COSE_KEY_KID] ?? unprotectedHeader[COSE_KEY_KID] ?? null
		const kid = kidRaw != null ? toUint8Array(kidRaw) : null
		const alg = (protectedHeader[COSE_KEY_ALG] ?? unprotectedHeader[COSE_KEY_ALG] ?? null) as number | null

		return {
			protectedBytes,
			protectedHeader: protectedHeader as Readonly<Record<number, unknown>>,
			unprotectedHeader: unprotectedHeader as Readonly<Record<number, unknown>>,
			payload: payloadRaw == null ? null : toUint8Array(payloadRaw),
			signature: toUint8Array(signatureRaw),
			kid,
			alg,
		}
	}
	catch (error) {
		throw new Error(`Failed to decode COSE_Sign1: ${(error as Error).message}`)
	}
}
