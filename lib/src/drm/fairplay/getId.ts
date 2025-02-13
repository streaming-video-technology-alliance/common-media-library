import { extractContentId } from './extractContentId';
import { decodeQueryString } from '../utils/decodeQueryString';

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
	const obj = decodeQueryString(licenseServerUrl);
	return obj[queryParam] || extractContentId(initData, queryParam);
}
