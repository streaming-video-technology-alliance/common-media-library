import type { MediaKeySystemAccessRequest } from '../common/MediaKeySystemAccessRequest.js';

/**
 * Attempts to get key system access using requestMediaKeySystemAccess from EME.
 *
 * @param requests - An array of key system access requests.
 * @returns MediaKeySystemAccess object if successful, or null if no system is supported.
 *
 * @group DRM
 * @beta
 */
export async function getKeySystemAccess(
	requests: MediaKeySystemAccessRequest[],
): Promise<MediaKeySystemAccess | null> {
	for (const { keySystem, configurations } of requests) {
		try {
			return await navigator.requestMediaKeySystemAccess(keySystem, configurations);
		}
		catch {
			// legacy approach could be used here
		}
	}
	return null;
}
