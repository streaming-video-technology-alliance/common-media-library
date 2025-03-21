import type { MediaCapability } from '../models/MediaCapability.js';
import type { KeySystemConfiguration } from '../models/KeySystemConfiguration.js';

/**
 * Creates a valid KeySystemConfiguration from supported audio and video capabilities.
 *
 * @param supportedAudio - supported audio capabilities.
 * @param supportedVideo - supported video capabilities.
 * @returns KeySystemConfiguration object.
 *
 * @group DRM
 * @beta
 * 
 * @example
 * {@includeCode ../../../test/drm/key-system/createMediaKeySystemConfiguration.test.ts#example}
 */
export function createMediaKeySystemConfiguration(
	supportedAudio: MediaCapability[] | null,
	supportedVideo: MediaCapability[] | null,
): KeySystemConfiguration {
	const config: KeySystemConfiguration = {};

	if (supportedAudio && supportedAudio.length > 0) {
		config.audioCapabilities = supportedAudio;
	}

	if (supportedVideo && supportedVideo.length > 0) {
		config.videoCapabilities = supportedVideo;
	}

	// default values 
	config.distinctiveIdentifier = 'optional';
	config.persistentState = 'optional';
	config.sessionTypes = ['temporary'];

	return config;
}
