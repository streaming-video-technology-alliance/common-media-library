import { describe, it } from 'node:test';
import { deepStrictEqual, strictEqual } from 'node:assert';
import { createMediaKeySystemConfiguration } from '@svta/common-media-library/drm/key-system/createMediaKeySystemConfiguration';
import type { MediaCapability } from '../../../dist/drm/common/MediaCapability';
import { SW_SECURE_DECODE } from '../../../dist/drm/common/SW_SECURE_DECODE';

describe('createMediaKeySystemConfiguration', () => {
	const audioCaps: MediaCapability[] = [
		{
			contentType: 'audio/mp4; codecs="mp4a.40.2"',
			robustness: SW_SECURE_DECODE,
		},
	];

	const videoCaps: MediaCapability[] = [
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
