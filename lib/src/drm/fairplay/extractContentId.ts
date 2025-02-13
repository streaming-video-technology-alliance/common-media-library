/**
 * Extracts the content ID from InitData using skd:// URI or query parameters.
 *
 * @param initData - The initialization data (PSSH box)
 * @param queryParam - The query parameter key to extract (default: 'ContentId')
 * @returns The extracted content ID as a string or null if not found
 *
 * @group DRM
 * @beta
 */
export function extractContentId(initData: Uint16Array, queryParam: string = 'ContentId'): string | null {
	const initDataString = new TextDecoder().decode(initData);

	// Try skd:// approach first
	const skdMatch = initDataString.match(/skd:\/\/([^"\s]+)/);
	if (skdMatch) {
		return skdMatch[1];
	}

	// If not skd://, then try extracting from query params
	const queryMatch = new RegExp(`${queryParam}=([^&\\s]+)`).exec(initDataString);
	return queryMatch ? queryMatch[1] : null;
}
