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
	const initDataString = new TextDecoder().decode(initData);

	// Try extracting skd:// content ID
	const skdMatch = initDataString.match(/skd:\/\/([^"\s]+)/);
	return skdMatch ? skdMatch[1] : '';
}
