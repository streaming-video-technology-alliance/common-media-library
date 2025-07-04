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
 * {@includeCode ../../../test/drm/keysystem/createMediaKeySystemConfiguration.test.ts#example}
 */
export function createMediaKeySystemConfiguration(
	supportedAudio: MediaKeySystemMediaCapability[] | null,
	supportedVideo: MediaKeySystemMediaCapability[] | null,
): MediaKeySystemConfiguration {
	const config: MediaKeySystemConfiguration = {};

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
