import { getLicenseServerUrlFromContentProtection, type ContentProtection } from '@svta/cml-drm';
import { strictEqual } from 'node:assert';
import { beforeEach, describe, it } from 'node:test';

describe('getLicenseServerUrlFromContentProtection', () => {
	let contentProtection: ContentProtection[];
	const schemeIdUri = 'urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed';

	beforeEach(() => {
		contentProtection = [
			{
				schemeIdUri: schemeIdUri,
				laUrl: 'license-server-url',
			},
		];
	});

	//#region example
	it('should return license server URL', () => {
		const result = getLicenseServerUrlFromContentProtection(contentProtection, schemeIdUri);
		strictEqual(result, 'license-server-url');
	});
	//#endregion example

	it('should return null if schemeIdUri does not match', () => {
		const result = getLicenseServerUrlFromContentProtection(contentProtection, 'nomatch');
		strictEqual(result, null);
	});

	it('should return null if license server URL is empty', () => {
		contentProtection[0].laUrl = '';
		const result = getLicenseServerUrlFromContentProtection(contentProtection, schemeIdUri);
		strictEqual(result, null);
	});

	it('should return null if laUrl attribute is missing', () => {
		delete contentProtection[0].laUrl;
		const result = getLicenseServerUrlFromContentProtection(contentProtection, schemeIdUri);
		strictEqual(result, null);
	});
});
