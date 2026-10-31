// The pure IIFE keeps this module-scope MediaKeys read from being retained by
// consumer bundlers when this function is unused (unknown global reads are
// treated as side effects).
const isTypeSupported = /* @__PURE__ */ (() => {
	if (typeof MediaKeys === 'undefined' || !('isTypeSupported' in MediaKeys)) {
		return undefined
	}

	const candidate: unknown = MediaKeys.isTypeSupported

	return typeof candidate === 'function'
		? (candidate as (keySystem: string, type: string) => boolean)
		: undefined
})()

/**
 * Filters and returns the supported key system configuration for a given system string.
 *
 * @param keySystem - Key system string such as 'com.widevine.alpha'
 * @param configs - An array of key system configurations.
 * @returns The first supported configuration or null if none are supported.
 *
 * @public
 */
export function getSupportedKeySystemConfiguration(
	keySystem: string,
	configs: Iterable<MediaKeySystemConfiguration>,
): {
	supportedAudio: MediaKeySystemMediaCapability[]
	supportedVideo: MediaKeySystemMediaCapability[]
} {
	if (!configs || typeof isTypeSupported === 'undefined') {
		return { supportedAudio: [], supportedVideo: [] }
	}

	for (const config of configs) {
		const audios = config.audioCapabilities || []
		const videos = config.videoCapabilities || []

		const supportedAudio = audios.filter(audio =>
			isTypeSupported(keySystem, audio.contentType ?? ''),
		)
		const supportedVideo = videos.filter(video =>
			isTypeSupported(keySystem, video.contentType ?? ''),
		)

		const hasAudio = supportedAudio.length > 0
		const hasVideo = supportedVideo.length > 0

		if (hasAudio || hasVideo) {
			return { supportedAudio, supportedVideo }
		}
	}

	return { supportedAudio: [], supportedVideo: [] }
}
