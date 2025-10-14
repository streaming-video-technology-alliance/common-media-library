import { createMediaKeySystemConfiguration, SW_SECURE_DECODE } from '@svta/cml-drm';
import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

describe('createMediaKeySystemConfiguration', () => {
	const audioCaps: MediaKeySystemMediaCapability[] = [
		{
			contentType: 'audio/mp4; codecs="mp4a.40.2"',
			robustness: SW_SECURE_DECODE,
		},
	];

	const videoCaps: MediaKeySystemMediaCapability[] = [
		{
			contentType: 'video/mp4; codecs="avc1.42E01E"',
			robustness: SW_SECURE_DECODE,
		},
	];

	it('should include both audio and video capabilities when provided', () => {
		//#region example
		const result = createMediaKeySystemConfiguration(audioCaps, videoCaps);
		//#endregion example
		deepStrictEqual(result.audioCapabilities, audioCaps);
		deepStrictEqual(result.videoCapabilities, videoCaps);
		strictEqual(result.distinctiveIdentifier, 'optional');
		strictEqual(result.persistentState, 'optional');
		deepStrictEqual(result.sessionTypes, ['temporary']);
	});

	it('should include neither audio nor video capabilities when both are null', () => {
		const result = createMediaKeySystemConfiguration(null, null);
		strictEqual(result.audioCapabilities, undefined);
		strictEqual(result.videoCapabilities, undefined);
	});

	it('should always set default values', () => {
		const result = createMediaKeySystemConfiguration(null, null);
		strictEqual(result.distinctiveIdentifier, 'optional');
		strictEqual(result.persistentState, 'optional');
		deepStrictEqual(result.sessionTypes, ['temporary']);
	});
});
