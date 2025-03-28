import type { ContentProtection } from '../common/ContentProtection';

/**
 * Extracts a license server URL from an array of ContentProtection elements.
 *
 * @param contentProtectionElements - Array of ContentProtection nodes from the manifest.
 * @param schemeIdUri - schemeIdUri we are searching for.
 * @returns The license server URL, and if not found then null.
 *
 * @group DRM
 * @beta
 * 
 * @example
 * {@includeCode ../../../test/drm/cemc/getLicenseServerUrlFromContentProtection.test.ts#example}
 */
export function getLicenseServerUrlFromContentProtection(
	contentProtectionElements: ContentProtection[],
	schemeIdUri: string,
): string | null {
	if (!Array.isArray(contentProtectionElements)) {
		return null;
	}

	for (const cp of contentProtectionElements) {
		if (cp.schemeIdUri === schemeIdUri) {
			const laUrl = cp.laUrl;

			if (laUrl && typeof laUrl === 'string') {
				return laUrl;
			}

			if (typeof laUrl === 'object' && laUrl.__text && typeof laUrl.__text === 'string') {
				return laUrl.__text;
			}
		}
	}

	return null;
}
