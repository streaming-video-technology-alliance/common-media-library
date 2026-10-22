import type { BmffHashExclusion } from './BmffHashExclusion.ts'
import { compileExclusions, findExcludedRanges } from './findExcludedRanges.ts'
import type { BmffBox } from './readRootBoxes.ts'

/**
 * Returns `true` if no byte of the root box reaches the C2PA content hash (C2PA section 18.6.2).
 *
 * An exclusion without a `subset` that matches the box excludes the box in its entirety.
 * Subset ranges and nested exclusions that together cover every byte of the box also count.
 * A nested xpath such as `/moov/udta` or a `subset` that leaves bytes of the box returns `false`.
 *
 * @param box - A root box with its 1-based index among the root boxes of the same type
 * @param exclusions - Exclusion list from the C2PA `c2pa.hash.bmff.v3` assertion
 * @returns `true` if none of the box bytes are hashed
 *
 * @example
 * {@includeCode ../../test/bmff/shouldExcludeBox.test.ts#example}
 *
 * @internal
 */
export function shouldExcludeBox(box: BmffBox, exclusions: readonly BmffHashExclusion[]): boolean {
	const ranges = findExcludedRanges(box, compileExclusions(exclusions))
	if (ranges === null) return true
	// The ranges are merged, so one range that spans the box means full coverage.
	return ranges.length === 1 && ranges[0].start === 0 && ranges[0].end === box.bytes.length
}
