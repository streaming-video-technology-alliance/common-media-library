import type { KeySystem } from '../common/KeySystem.js';
import type { KeySystemConfiguration } from '../common/KeySystemConfiguration.js';
import type { KeySystemAccess } from '../common/KeySystemAccess.js';
import { getSupportedKeySystemConfiguration } from './getSupportedKeySystemConfiguration.js';
import { createMediaKeySystemConfiguration } from './createMediaKeySystemConfiguration.js';

/**
 * Fallback method to get key system access using legacy MediaKeys.isTypeSupported().
 *
 * @param ksConfigurations - An array of key system configurations.
 * @returns A KeySystemAccess object if successful, or null if no system is supported.
 *
 * @group DRM
 * @beta
 */
export function getLegacyKeySystemAccess(
	ksConfigurations: { ks: KeySystem; configs: KeySystemConfiguration[] }[],
): KeySystemAccess | null {
	for (const { ks, configs } of ksConfigurations) {
		const supportedConfig = getSupportedKeySystemConfiguration(ks.systemString, configs);
		if (supportedConfig) {
			const configuration = createMediaKeySystemConfiguration(
				supportedConfig.supportedAudio,
				supportedConfig.supportedVideo,
			);

			return {
				keySystem: ks.systemString,
				configuration,
			};
		}
	}
	return null;
}
