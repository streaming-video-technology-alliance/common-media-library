import type { KeySystem } from '../common/KeySystem.ts';
import type { KeySystemConfiguration } from '../common/KeySystemConfiguration.ts';

/**
 * Attempts to get key system access using requestMediaKeySystemAccess from EME.
 *
 * @param ksConfigurations - An array of key system configurations.
 * @returns MediaKeySystemAccess object if successful, or null if no system is supported.
 *
 * @group DRM
 * @beta
 */
export async function getKeySystemAccess(
	ksConfigurations: { ks: KeySystem; configs: KeySystemConfiguration[] }[],
): Promise<MediaKeySystemAccess | null> {
	for (const { ks, configs } of ksConfigurations) {
		try {
			return await navigator.requestMediaKeySystemAccess(ks.systemString, configs);
		}
		catch {
			// legacy approach ccould be used here
		}
	}
	return null;
}
