import type { ContentProtection } from '../models/ContentProtection';
import { MP4_PROTECTION_SCHEME } from '../common/const/MP4_PROTECTION_SCHEME';
import { ENCRYPTION_SCHEME } from '../common/const/ENCRYPTION_SCHEME';

/**
 * Finds and returns the ContentProtection element for MP4 Common Encryption.
 *
 * @param cpArray - Array of ContentProtection elements.
 * @returns The Common Encryption content protection element, or null if not found.
 *
 * @group DRM
 */
export function findCencContentProtection(cpArray: ContentProtection[]): ContentProtection | null {
	if (!cpArray) {
		return null;
	}

	for (const cp of cpArray) {
		if (
			cp.schemeIdUri?.toLowerCase() === MP4_PROTECTION_SCHEME &&
      cp.value &&
        (cp.value.toLowerCase() === ENCRYPTION_SCHEME.CENC || 
        cp.value.toLowerCase() === ENCRYPTION_SCHEME.CBCS)
		) {
			return cp;
		}
	}

	return null;
}
