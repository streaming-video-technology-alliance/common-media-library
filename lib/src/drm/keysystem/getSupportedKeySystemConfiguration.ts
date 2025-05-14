import type { KeySystemConfiguration } from '../common/KeySystemConfiguration';
import type { MediaCapability } from '../common/MediaCapability';

const isTypeSupported: (keySystem: string, type: string) => boolean | undefined = (typeof MediaKeys !== 'undefined' && typeof (MediaKeys as any).isTypeSupported === 'function') ? (MediaKeys as any).isTypeSupported : undefined;

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
): { supportedAudio: MediaCapability[]; supportedVideo: MediaCapability[] } {
	if (!configs || configs.length === 0 || typeof isTypeSupported === 'undefined') {
		return { supportedAudio: [], supportedVideo: [] };
	}

	for (const config of configs) {
		const audios = config.audioCapabilities || [];
		const videos = config.videoCapabilities || [];

		const supportedAudio = audios.filter(audio => isTypeSupported(keySystemString, audio.contentType));
		const supportedVideo = videos.filter(video => isTypeSupported(keySystemString, video.contentType));

		const hasAudio = supportedAudio.length > 0;
		const hasVideo = supportedVideo.length > 0;

		if (hasAudio || hasVideo) {
			return { supportedAudio, supportedVideo };
		}
	}

	return { supportedAudio: [], supportedVideo: [] };
}
