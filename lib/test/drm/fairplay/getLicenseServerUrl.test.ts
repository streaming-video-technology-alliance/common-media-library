import { getLicenseServerUrl } from '@svta/common-media-library/drm/fairplay/getLicenseServerUrl';
import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

describe('getLicenseServerUrl', () => {
	it('returns licenseUrl from drmConfig when it is available', () => {
		const initData = new Uint16Array();
		const drmConfig = { licenseUrl: 'https://common-media-library.com' };

		strictEqual(getLicenseServerUrl(initData, drmConfig), 'https://common-media-library.com');
	});

	it('extracts URL from initData when licenseUrl is not available', () => {
		const initData = new Uint16Array([...new TextEncoder().encode('skd://common-media-library.com')]);
		const drmConfig = {};

		strictEqual(getLicenseServerUrl(initData, drmConfig), 'https://common-media-library.com');
	});
});
