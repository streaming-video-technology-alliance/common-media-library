import type { MediaCapability } from '../common/MediaCapability.js';
import type { KeySystemConfiguration } from '../common/KeySystemConfiguration.js';

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
	const isTypeSupported = getLegacyIsTypeSupported() ?? (() => false);

	for (const config of configs) {
		const audios = config.audioCapabilities || [];
		const videos = config.videoCapabilities || [];

		const supportedAudio = audios.length > 0
			? audios.filter(audio => isTypeSupported(keySystemString, audio.contentType))
			: null;

		const supportedVideo = videos.length > 0
			? videos.filter(video => isTypeSupported(keySystemString, video.contentType))
			: null;

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

// Helper func to determine if isTypeSupported is available
// This is the only viable approach to avoid Type error from 
// using MediaKeys.isTypeSuported and avoid using window
function getLegacyIsTypeSupported() {
	type LegacyMediaKeys = typeof MediaKeys & {
		isTypeSupported?: (keySystem: string, type: string) => boolean;
	};
	const legacy = MediaKeys as LegacyMediaKeys;

	return legacy.isTypeSupported ?? null;
}
  
