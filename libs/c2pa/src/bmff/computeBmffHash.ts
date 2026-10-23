import type { BmffHashExclusion } from './BmffHashExclusion.ts'
import { type ByteRange, compileExclusions, findExcludedRanges } from './findExcludedRanges.ts'
import { type BmffBox, readRootBoxes } from './readRootBoxes.ts'

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

function excludedLength(ranges: readonly ByteRange[]): number {
	let length = 0
	for (const range of ranges) length += range.end - range.start
	return length
}

// Writes the box bytes outside `ranges` to `target` at `offset` and returns the number of bytes written.
function writeKeptBytes(
	target: Uint8Array,
	offset: number,
	bytes: Uint8Array,
	ranges: readonly ByteRange[],
): number {
	if (ranges.length === 0) {
		target.set(bytes, offset)
		return bytes.length
	}
	let written = 0
	let start = 0
	for (const range of ranges) {
		target.set(bytes.subarray(start, range.start), offset + written)
		written += range.start - start
		start = range.end
	}
	target.set(bytes.subarray(start), offset + written)
	return written + bytes.length - start
}

function buildHashInput(
	bytes: Uint8Array,
	exclusions: readonly BmffHashExclusion[],
	offsetPrefixSize: number,
): Uint8Array<ArrayBuffer> {
	if (offsetPrefixSize !== 0 && offsetPrefixSize !== 8) {
		throw new Error(`offsetPrefixSize must be 0 or 8, got ${offsetPrefixSize}`)
	}
	const compiled = compileExclusions(exclusions)

	// First pass: select the boxes, find their excluded ranges, and calculate the total size
	const included: BmffBox[] = []
	const excluded: (readonly ByteRange[])[] = []
	let totalLength = 0
	for (const box of readRootBoxes(bytes)) {
		const ranges = findExcludedRanges(box, compiled)
		if (ranges === null) continue
		included.push(box)
		excluded.push(ranges)
		totalLength += offsetPrefixSize + box.bytes.length - excludedLength(ranges)
	}

	// Second pass: write directly into pre-sized buffer
	const hashInput = new Uint8Array(totalLength)
	const view = new DataView(hashInput.buffer)
	let writeOffset = 0
	for (let i = 0; i < included.length; i++) {
		const box = included[i]
		if (offsetPrefixSize > 0) {
			view.setBigUint64(writeOffset, BigInt(box.offset), false)
			writeOffset += offsetPrefixSize
		}
		writeOffset += writeKeptBytes(hashInput, writeOffset, box.bytes, excluded[i])
	}

	return hashInput
}

/**
 * Computes the C2PA BMFF content hash (`c2pa.hash.bmff.v3`) for a DASH segment.
 *
 * Iterates through the root BMFF boxes and drops each box that an exclusion excludes in its
 * entirety. Inside the other root boxes, the function drops the byte ranges of nested
 * exclusions and `subset` exclusions (C2PA section 18.6.2). It concatenates the remaining
 * bytes of each root box, optionally prefixed with the file offset of the box, and returns
 * the WebCrypto digest.
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
export async function computeBmffHash(
	segmentBytes: Uint8Array,
	options?: BmffHashOptions,
): Promise<Uint8Array> {
	const exclusions = options?.exclusions ?? []
	const alg = options?.alg ?? DEFAULT_HASH_ALG
	const offsetPrefixSize = options?.offsetPrefixSize ?? 0

	const hashInput = buildHashInput(segmentBytes, exclusions, offsetPrefixSize)
	const hashBuffer = await crypto.subtle.digest(alg, hashInput)
	return new Uint8Array(hashBuffer)
}
