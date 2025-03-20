import type { MediaCapability } from '../models/MediaCapability.js';
import type { KeySystemConfiguration } from '../models/KeySystemConfiguration.js';

/**
 * Filters and returns the supported key system configuration for a given system string.
 *
 * @param keySystemString - Key system string such as 'com.widevine.alpha'
 * @param configs - An array of key system configurations.
 * @returns The first supported configuration or null if none are supported.
 *
 * @group DRM
 * @beta
 */
export function getSupportedKeySystemConfiguration(
	keySystemString: string,
	configs: KeySystemConfiguration[],
): { supportedAudio: MediaCapability[] | null; supportedVideo: MediaCapability[] | null } | null {
	if (!configs || configs.length === 0) {
		return null;
	}

	// legacy isTypeSupported from MediaKeys
	const isTypeSupported = (window.MediaKeys as any)?.isTypeSupported;

	for (const config of configs) {
		let supportedAudio: MediaCapability[] | null = null;
		let supportedVideo: MediaCapability[] | null = null;

		const audios = config.audioCapabilities || [];
		const videos = config.videoCapabilities || [];

		// Check audioCapabilities
		if (audios.length > 0) {
			supportedAudio = audios.filter((audio) =>
				typeof isTypeSupported === 'function'
					? isTypeSupported(keySystemString, audio.contentType)
					: false,
			);
		}

		// Check videoCapabilities
		if (videos.length > 0) {
			supportedVideo = videos.filter((video) =>
				typeof isTypeSupported === 'function'
					? isTypeSupported(keySystemString, video.contentType)
					: false,
			);
		}

		const hasAudio = supportedAudio && supportedAudio.length > 0;
		const hasVideo = supportedVideo && supportedVideo.length > 0;

		if (hasAudio || hasVideo) {
			return {
				supportedAudio: hasAudio ? supportedAudio : null,
				supportedVideo: hasVideo ? supportedVideo : null,
			};
		}
	}

	return null;
}
