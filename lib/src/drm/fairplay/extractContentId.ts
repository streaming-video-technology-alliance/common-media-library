import { UTF_16 } from '../../utils/UTF_16.js';

/**
 * Extracts the content ID from InitData using skd:// URI or query parameters.
 *
 * @param initData - The initialization data (PSSH box)
 * @returns The extracted content ID as a string or null if not found
 *
 * @group DRM
 * @beta
 */
export function extractContentId(initData: Uint16Array): string {
	const initDataString = new TextDecoder(UTF_16).decode(initData);

	// Try extracting skd:// content ID
	return initDataString.split('skd://')[1] || '';
}
