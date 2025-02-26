import { getLicenseServerUrl } from '@svta/common-media-library/drm/fairplay/getLicenseServerUrl';
import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

describe('getLicenseServerUrl', () => {
	it('extracts URL from initData when skd:// is present', () => {
		const initData = new Uint16Array([...new TextEncoder().encode('skd://common-media-library.com')]);
		strictEqual(getLicenseServerUrl(initData), 'https://common-media-library.com');
	});

	it('returns an empty string when skd:// is missing', () => {
		const initData = new Uint16Array([...new TextEncoder().encode('invalid-initData')]);
		strictEqual(getLicenseServerUrl(initData), '');
	});
});
