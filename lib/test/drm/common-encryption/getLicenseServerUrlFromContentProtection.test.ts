import { getLicenseServerUrlFromContentProtection } from '@svta/common-media-library/drm/common-encryption/getLicenseServerUrlFromContentProtection';
import { beforeEach, describe, it } from 'node:test';
import { strictEqual } from 'node:assert';

describe('getLicenseServerUrlFromContentProtection', () => {
	let contentProtection: any[];
	const schemeIdUri = 'urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed';

	beforeEach(() => {
		contentProtection = [
			{
				schemeIdUri: schemeIdUri,
				laUrl: {
					__prefix: 'dashif',
					__text: 'license-server-url',
				},
			},
		];
	});

	//#region example
	it('should return license server URL for dashif prefix', () => {
		const result = getLicenseServerUrlFromContentProtection(contentProtection, schemeIdUri);
		strictEqual(result, 'license-server-url');
	});
	//#endregion example

	it('should return null if schemeIdUri does not match', () => {
		const result = getLicenseServerUrlFromContentProtection(contentProtection, 'nomatch');
		strictEqual(result, null);
	});

	it('should return null if license server URL is empty', () => {
		contentProtection[0].laUrl.__text = '';
		const result = getLicenseServerUrlFromContentProtection(contentProtection, schemeIdUri);
		strictEqual(result, null);
	});

	it('should return null if laUrl attribute is missing', () => {
		delete contentProtection[0].laUrl;
		const result = getLicenseServerUrlFromContentProtection(contentProtection, schemeIdUri);
		strictEqual(result, null);
	});

	it('should return license server URL for clearkey prefix', () => {
		contentProtection[0].laUrl.__prefix = 'clearkey';
		const result = getLicenseServerUrlFromContentProtection(contentProtection, schemeIdUri);
		strictEqual(result, 'license-server-url');
	});

	it('should return license server URL for ck prefix', () => {
		contentProtection[0].laUrl.__prefix = 'ck';
		const result = getLicenseServerUrlFromContentProtection(contentProtection, schemeIdUri);
		strictEqual(result, 'license-server-url');
	});
});
