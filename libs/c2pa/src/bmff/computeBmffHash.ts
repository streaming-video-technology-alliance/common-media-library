import type { BmffHashExclusion } from './BmffHashExclusion.ts'
import { readRootBoxes, type RootBox } from './readRootBoxes.ts'
import { shouldExcludeBox } from './shouldExcludeBox.ts'

const DEFAULT_HASH_ALG = 'SHA-256'

/**
 * Options for BMFF content hash computation.
 *
 * @internal
 */
export type BmffHashOptions = {
	readonly exclusions?: readonly BmffHashExclusion[]
	readonly alg?: string
	/** `8` for offset-prefix mode, `0` (default) for no prefix. */
	readonly offsetPrefixSize?: number
}

function buildHashInput(
	bytes: Uint8Array,
	exclusions: readonly BmffHashExclusion[],
	offsetPrefixSize: number,
): Uint8Array {
	if (offsetPrefixSize !== 0 && offsetPrefixSize !== 8) {
		throw new Error(`offsetPrefixSize must be 0 or 8, got ${offsetPrefixSize}`)
	}

	// First pass: select the boxes and calculate the total size
	const included: RootBox[] = []
	let totalLength = 0
	for (const box of readRootBoxes(bytes)) {
		if (shouldExcludeBox(box.type, box.bytes, exclusions)) continue
		included.push(box)
		totalLength += offsetPrefixSize + box.bytes.length
	}

	// Second pass: write directly into pre-sized buffer
	const hashInput = new Uint8Array(totalLength)
	const view = new DataView(hashInput.buffer)
	let writeOffset = 0
	for (const box of included) {
		if (offsetPrefixSize > 0) {
			view.setBigUint64(writeOffset, BigInt(box.offset), false)
			writeOffset += offsetPrefixSize
		}
		hashInput.set(box.bytes, writeOffset)
		writeOffset += box.bytes.length
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
 * @internal
 */
export async function computeBmffHash(segmentBytes: Uint8Array, options?: BmffHashOptions): Promise<Uint8Array> {
	const exclusions = options?.exclusions ?? []
	const alg = options?.alg ?? DEFAULT_HASH_ALG
	const offsetPrefixSize = options?.offsetPrefixSize ?? 0

	const hashInput = buildHashInput(segmentBytes, exclusions, offsetPrefixSize)
	const hashBuffer = await crypto.subtle.digest(alg, hashInput)
	return new Uint8Array(hashBuffer)
}
