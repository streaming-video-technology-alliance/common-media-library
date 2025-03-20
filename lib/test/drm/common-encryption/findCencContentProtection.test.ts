import { describe, it } from 'node:test';
import { strictEqual } from 'node:assert';
import { findCencContentProtection } from '@svta/common-media-library/drm/common-encryption/findCencContentProtection';
import { MP4_PROTECTION_SCHEME } from '@svta/common-media-library/drm/common/const/MP4_PROTECTION_SCHEME';

describe('findCencContentProtection', () => {

	it('should return null if no matching ContentProtection is found', () => {
		//#region example
		const cpArray = [
			{
				schemeIdUri: 'urn:some:other:schema',
				value: 'cenc',
			},
			{
				schemeIdUri: MP4_PROTECTION_SCHEME,
				value: 'other',
			},
		];

		const result = findCencContentProtection(cpArray);
		//#endregion example
		strictEqual(result, null);
	});

	it('should return the ContentProtection with matching schemeIdUri and value = "cenc"', () => {
		const matchingCP = {
			schemeIdUri: MP4_PROTECTION_SCHEME,
			value: 'cenc',
		};

		const cpArray = [
			{
				schemeIdUri: 'urn:some:other:schema',
				value: 'cenc',
			},
			matchingCP,
		];

		const result = findCencContentProtection(cpArray);
		strictEqual(result, matchingCP);
	});

	it('should return the ContentProtection with matching schemeIdUri and value = "cbcs"', () => {
		const matchingCP = {
			schemeIdUri: MP4_PROTECTION_SCHEME,
			value: 'cbcs',
		};

		const cpArray = [matchingCP];

		const result = findCencContentProtection(cpArray);
		strictEqual(result, matchingCP);
	});

	it('should be case-insensitive for schemeIdUri and value', () => {
		const matchingCP = {
			schemeIdUri: MP4_PROTECTION_SCHEME.toUpperCase(), 
			value: 'CENC', // uppercase value
		};

		const cpArray = [matchingCP];

		const result = findCencContentProtection(cpArray);
		strictEqual(result, matchingCP);
	});
});
