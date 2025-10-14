import type { MediaKeySystemAccessRequest } from '../common/MediaKeySystemAccessRequest.ts';
import { createMediaKeySystemConfiguration } from './createMediaKeySystemConfiguration.ts';
import { getSupportedKeySystemConfiguration } from './getSupportedKeySystemConfiguration.ts';

/**
 * Fallback method to get key system access using legacy MediaKeys.isTypeSupported().
 *
 * @param requests - An array of key system access requests.
 * @returns A KeySystemAccess object if successful, or null if no system is supported.
 *
 * @beta
 */
export function getLegacyKeySystemAccess(
	requests: MediaKeySystemAccessRequest[],
): MediaKeySystemAccessRequest | null {
	for (const { keySystem, configurations } of requests) {
		const supportedConfig = getSupportedKeySystemConfiguration(keySystem, configurations);
		if (supportedConfig) {
			const configuration = createMediaKeySystemConfiguration(
				supportedConfig.supportedAudio,
				supportedConfig.supportedVideo,
			);

			return {
				keySystem,
				configurations: [configuration],
			};
		}
	}
	return null;
}
