import type { KeySystem } from '../models/KeySystem.js';
import type { KeySystemConfiguration } from '../common/KeySystemConfiguration.js';
import type { KeySystemAccess } from '../common/KeySystemAccess.js';
import { getSupportedKeySystemConfiguration } from './getSupportedKeySystemConfiguration.js';
import { createMediaKeySystemConfiguration } from './createMediaKeySystemConfiguration.js';

/**
 * Attempts to get key system access using requestMediaKeySystemAccess 
 * and legacy isTypeSupported approaches.
 *
 * @param ksConfigurations - An array of key system configurations.
 * @returns A Promise resolving to a KeySystemAccess object if successful, or null if no system is supported.
 *
 * @group DRM
 * @beta
 */
export async function getCompatibleKeySystemAccess(
	ksConfigurations: { ks: KeySystem; configs: KeySystemConfiguration[] }[],
): Promise<KeySystemAccess | null> {
	for (const { ks, configs } of ksConfigurations) {
		try {
			const access = await navigator.requestMediaKeySystemAccess(ks.systemString, configs);
			return {
				keySystem: ks.systemString,
				configuration: access.getConfiguration(),
			};
		}
		catch (error) {
			// If requestMediaKeySystemAccess fails,
			// we need to fallback to `isTypeSupported`
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
	}
  
	return null; 
}
