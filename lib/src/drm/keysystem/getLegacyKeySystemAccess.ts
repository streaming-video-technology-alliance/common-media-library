import type { KeySystem } from '../common/KeySystem';
import type { KeySystemAccess } from '../common/KeySystemAccess';
import type { KeySystemConfiguration } from '../common/KeySystemConfiguration';
import { createMediaKeySystemConfiguration } from './createMediaKeySystemConfiguration.ts';
import { getSupportedKeySystemConfiguration } from './getSupportedKeySystemConfiguration.ts';

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
