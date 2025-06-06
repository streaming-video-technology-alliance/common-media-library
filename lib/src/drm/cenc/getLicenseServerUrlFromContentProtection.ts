import type { ContentProtection } from '../common/ContentProtection.js';

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
 * {@includeCode ../../../test/drm/cenc/getLicenseServerUrlFromContentProtection.test.ts#example}
 */
export function getLicenseServerUrlFromContentProtection(
	contentProtectionElements: ContentProtection[],
	schemeIdUri: string,
): string | null {
	return contentProtectionElements.find(cp => cp.schemeIdUri === schemeIdUri)?.laUrl || null;
}
