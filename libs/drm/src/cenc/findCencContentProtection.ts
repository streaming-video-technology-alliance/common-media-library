import { CBCS } from '../common/CBCS.ts'
import { CENC } from '../common/CENC.ts'
import type { ContentProtection } from '../common/ContentProtection.ts'
import { MP4_PROTECTION_SCHEME } from '../common/MP4_PROTECTION_SCHEME.ts'

/**
 * Finds and returns the ContentProtection element for MP4 Common Encryption.
 *
 * @param cpArray - Array of ContentProtection elements.
 * @returns The Common Encryption content protection element, or null if not found.
 *
 * @public
 *
 * @example
 * {@includeCode ../../test/cenc/findCencContentProtection.test.ts#example}
 */
export function findCencContentProtection(cpArray: ContentProtection[]): ContentProtection | null {
	if (!cpArray) {
		return null
	}

	for (const cp of cpArray) {
		if (
			cp.schemeIdUri?.toLowerCase() === MP4_PROTECTION_SCHEME &&
			cp.value &&
			(cp.value.toLowerCase() === CENC ||
				cp.value.toLowerCase() === CBCS)
		) {
			return cp
		}
	}

	return null
}
