
/**
 * Attempts to get key system access using requestMediaKeySystemAccess from EME.
 *
 * @param configurations - An array of key system configurations.
 * @returns MediaKeySystemAccess object if successful, or null if no system is supported.
 *
 * @group DRM
 * @beta
 */
export async function getKeySystemAccess(
	configurations: { keySystem: string; configs: Iterable<MediaKeySystemConfiguration> }[],
): Promise<MediaKeySystemAccess | null> {
	for (const { keySystem, configs } of configurations) {
		try {
			return await navigator.requestMediaKeySystemAccess(keySystem, configs);
		}
		catch {
			// legacy approach could be used here
		}
	}
	return null;
}
