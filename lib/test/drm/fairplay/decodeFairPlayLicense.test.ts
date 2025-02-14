import { decodeFairPlayLicense } from '@svta/common-media-library/drm/fairplay/decodeFairPlayLicense';
import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'node:test';

describe('decodeFairPlayLicense', () => {
	it('decodes base64 string to Uint8Array', () => {
		const base64String = btoa('test');
		const result = decodeFairPlayLicense(base64String);
		deepStrictEqual(new TextDecoder().decode(result), 'test');
	});

	it('returns Uint8Array if input is ArrayBuffer', () => {
		const buffer = new TextEncoder().encode('test').buffer;
		const result = decodeFairPlayLicense(buffer);
		deepStrictEqual(new Uint8Array(buffer), result);
	});
});

