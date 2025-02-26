import { extractContentId } from './extractContentId.js';

/**
 * Extracts the content ID from the license server URL or InitData.
 *
 * @param licenseServerUrl - The license server URL
 * @param initData - The initialization data (PSSH box)
 * @param queryParam - The query parameter key to extract (default: 'ContentId')
 * @returns The extracted content ID as a string or null if not found
 *
 * @group DRM
 * @beta
 */

export function getId(licenseServerUrl: string, initData: Uint16Array, queryParam: string = 'ContentId'): string | null {
	try {
		const url = new URL(licenseServerUrl);
		const params = new URLSearchParams(url.search);
		return params.get(queryParam) || extractContentId(initData);
	} 
	catch {
		// in case if URL parsing fails, 
		// fallback to extracting from initData
		return extractContentId(initData);
	}
}
