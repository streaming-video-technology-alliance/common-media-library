import type { BmffHashExclusion } from './BmffHashExclusion.ts'
import { shouldExcludeBox } from './shouldExcludeBox.ts'

const MINIMUM_BOX_SIZE = 8 // size(4) + type(4)
const BOX_TYPE_OFFSET = 4
const DEFAULT_HASH_ALG = 'SHA-256'

/**
 * Options for BMFF content hash computation.
 *
 * @public
 */
export type BmffHashOptions = {
	readonly exclusions?: readonly BmffHashExclusion[]
	readonly alg?: string
	/** `8` for offset-prefix mode, `0` (default) for no prefix. */
	readonly offsetPrefixSize?: number
}

function readBoxType(bytes: Uint8Array, offset: number): string {
	return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3])
}

function writeUint64BigEndian(bytes: Uint8Array, value: number): void {
	new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).setBigUint64(0, BigInt(value), false)
}

function buildHashInput(
	bytes: Uint8Array,
	exclusions: readonly BmffHashExclusion[],
	offsetPrefixSize: number,
): Uint8Array {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
	const parts: Uint8Array[] = []
	let offset = 0

	while (offset + MINIMUM_BOX_SIZE <= bytes.length) {
		const boxSize = view.getUint32(offset, false)
		if (boxSize < MINIMUM_BOX_SIZE || offset + boxSize > bytes.length) break

		const boxType = readBoxType(bytes, offset + BOX_TYPE_OFFSET)
		const boxData = bytes.subarray(offset, offset + boxSize)

		if (!shouldExcludeBox(boxType, boxData, exclusions)) {
			if (offsetPrefixSize > 0) {
				const prefix = new Uint8Array(offsetPrefixSize)
				writeUint64BigEndian(prefix, offset)
				const combined = new Uint8Array(offsetPrefixSize + boxData.length)
				combined.set(prefix, 0)
				combined.set(boxData, offsetPrefixSize)
				parts.push(combined)
			} else {
				parts.push(boxData)
			}
		}

		offset += boxSize
	}

	const totalLength = parts.reduce((sum, part) => sum + part.length, 0)
	const hashInput = new Uint8Array(totalLength)
	let writeOffset = 0
	for (const part of parts) {
		hashInput.set(part, writeOffset)
		writeOffset += part.length
	}
	return hashInput
}

/**
 * Computes the C2PA BMFF content hash (`c2pa.hash.bmff.v3`) for a DASH segment.
 *
 * Iterates through top-level BMFF boxes, excludes those matching the exclusion list,
 * concatenates the remaining box bytes (optionally prefixed with each box's file offset),
 * and returns the WebCrypto digest.
 *
 * @param segmentBytes - Raw segment bytes to hash
 * @param options - Hash options (exclusions, algorithm, offset prefix size)
 * @returns The computed hash bytes
 *
 * @example
 * {@includeCode ../../test/bmff/computeBmffHash.test.ts#example}
 *
 * @public
 */
export async function computeBmffHash(segmentBytes: Uint8Array, options?: BmffHashOptions): Promise<Uint8Array> {
	const exclusions = options?.exclusions ?? []
	const alg = options?.alg ?? DEFAULT_HASH_ALG
	const offsetPrefixSize = options?.offsetPrefixSize ?? 0

	const hashInput = buildHashInput(segmentBytes, exclusions, offsetPrefixSize)
	const hashBuffer = await crypto.subtle.digest(alg, hashInput)
	return new Uint8Array(hashBuffer)
}
