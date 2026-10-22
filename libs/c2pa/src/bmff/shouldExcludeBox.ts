import type { BmffHashExclusion } from './BmffHashExclusion.ts'
import { compileExclusions, findExcludedRanges } from './findExcludedRanges.ts'
import type { BmffBox } from './readRootBoxes.ts'

/**
 * Returns `true` if the exclusions exclude the root box in its entirety from the
 * C2PA content hash (C2PA section 18.6.2).
 *
 * A nested xpath such as `/moov/udta` or an exclusion with a `subset` excludes only
 * part of the box, so the function returns `false` for them.
 *
 * @param box - A root box with its 1-based index among the root boxes of the same type
 * @param exclusions - Exclusion list from the C2PA `c2pa.hash.bmff.v3` assertion
 * @returns `true` if the box contributes nothing to the hash input
 *
 * @example
 * {@includeCode ../../test/bmff/shouldExcludeBox.test.ts#example}
 *
 * @internal
 */
export function shouldExcludeBox(box: BmffBox, exclusions: readonly BmffHashExclusion[]): boolean {
	return findExcludedRanges(box, compileExclusions(exclusions)) === null
}
