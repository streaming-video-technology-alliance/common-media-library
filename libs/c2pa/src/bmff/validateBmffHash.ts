import type { BmffHashExclusion } from './BmffHashExclusion.ts'
import { computeBmffHash } from './computeBmffHash.ts'
import { hashesEqual } from '../utils.ts'

const OFFSET_PREFIX_SIZES_TO_TRY = [8, 0] as const

/**
 * Options for BMFF hash validation.
 *
 * @public
 */
export type BmffHashValidationOptions = {
	readonly exclusions?: readonly BmffHashExclusion[]
	readonly alg?: string
}

/**
 * Validates the C2PA BMFF content hash (`c2pa.hash.bmff.v3`) for a DASH segment.
 *
 * Tries both offset-prefix modes — 8-byte file offset prefix and no prefix — to handle
 * inter-signer interoperability for hashes carried in the VSI CBOR map (§19.7.3), where
 * the spec does not signal the prefix mode. Flat hashes from a `c2pa.hash.bmff.v3`
 * assertion always use the 8-byte prefix (§18.6.2); verify those with
 * {@link computeBmffHash} and `offsetPrefixSize: 8` instead.
 *
 * @param segmentBytes - Raw segment bytes to validate
 * @param expectedHash - Expected hash bytes from the VSI CBOR map
 * @param options - Validation options (exclusions, algorithm)
 * @returns `true` if the computed hash matches the expected hash in either offset mode
 *
 * @example
 * {@includeCode ../../test/bmff/validateBmffHash.test.ts#example}
 *
 * @public
 */
export async function validateBmffHash(
	segmentBytes: Uint8Array,
	expectedHash: Uint8Array,
	options?: BmffHashValidationOptions,
): Promise<boolean> {
	for (const offsetPrefixSize of OFFSET_PREFIX_SIZES_TO_TRY) {
		const hash = await computeBmffHash(segmentBytes, { ...options, offsetPrefixSize })
		if (hashesEqual(hash, expectedHash)) return true
	}
	return false
}
