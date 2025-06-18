import type { KeySystemAccess } from '../common/KeySystemAccess.js';
import { createMediaKeySystemConfiguration } from './createMediaKeySystemConfiguration.js';
import { getSupportedKeySystemConfiguration } from './getSupportedKeySystemConfiguration.js';

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
	ksConfigurations: { keySystem: string; configs: Iterable<MediaKeySystemConfiguration> }[],
): KeySystemAccess | null {
	for (const { keySystem, configs } of ksConfigurations) {
		const supportedConfig = getSupportedKeySystemConfiguration(keySystem, configs);
		if (supportedConfig) {
			const configuration = createMediaKeySystemConfiguration(
				supportedConfig.supportedAudio,
				supportedConfig.supportedVideo,
			);

			return {
				keySystem,
				configuration,
			};
		}
	}
	return null;
}
