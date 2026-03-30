import type { BmffHashConstraint, BmffHashExclusion } from './BmffHashExclusion.ts'

const FULL_BOX_HEADER_OFFSET = 12 // size(4) + type(4) + version(1) + flags(3)

function bytesMatchAt(boxData: Uint8Array, offset: number, expected: Uint8Array | readonly number[]): boolean {
	const bytes = expected instanceof Uint8Array ? expected : new Uint8Array(expected as number[])
	if (offset + bytes.length > boxData.length) return false
	for (let i = 0; i < bytes.length; i++) {
		if (boxData[offset + i] !== bytes[i]) return false
	}
	return true
}

function constraintMatches(boxData: Uint8Array, constraint: BmffHashConstraint): boolean {
	const { offset, value } = constraint
	// Support both absolute offset (from box start) and FullBox-payload-relative offset
	return bytesMatchAt(boxData, offset, value) || bytesMatchAt(boxData, offset + FULL_BOX_HEADER_OFFSET, value)
}

/**
 * Returns `true` if the given BMFF box should be excluded from the
 * C2PA content hash, based on the provided exclusion list.
 *
 * Exclusions use C2PA xpath notation (e.g. `/emsg`, `/moof/traf`).
 * Optional `data` constraints narrow the match to specific box content by byte offset.
 *
 * @param boxType - Four-character box type code (e.g. `'emsg'`, `'moof'`)
 * @param boxData - Full box bytes including the 8-byte size+type header
 * @param exclusions - Exclusion list from the C2PA `c2pa.hash.bmff.v3` assertion
 * @returns `true` if the box should be excluded from the hash input
 *
 * @example
 * {@includeCode ../../test/bmff/shouldExcludeBox.test.ts#example}
 *
 * @public
 */
export function shouldExcludeBox(
	boxType: string,
	boxData: Uint8Array,
	exclusions: readonly BmffHashExclusion[],
): boolean {
	for (const exclusion of exclusions) {
		if (!exclusion.xpath) continue
		const xpathMatchesType = exclusion.xpath === `/${boxType}` || exclusion.xpath.startsWith(`/${boxType}/`)
		if (!xpathMatchesType) continue
		const { data } = exclusion
		if (!data || data.length === 0) return true
		if (data.every(constraint => constraintMatches(boxData, constraint))) return true
	}
	return false
}
