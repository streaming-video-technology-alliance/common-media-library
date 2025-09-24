import { getId } from '@svta/common-media-library/drm/fairplay/getId';
import { stringToUint16 } from '@svta/common-media-library/utils/stringToUint16';
import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

describe('getId', () => {
	it('extracts contentId from skd:// format', () => {
		//#region example
		const laUrl = 'https://common-media-library.com';
		const initData = stringToUint16('\tskd://common-media-library.com/asset1234').buffer;

		strictEqual(getId(laUrl, initData), 'common-media-library.com/asset1234');
		//#endregion example
	});

	it('extracts query param when provided', () => {
		const laUrl = 'https://common-media-library.com?videoId=svta-cml';
		const initData = new Uint16Array().buffer;

		strictEqual(getId(laUrl, initData, 'videoId'), 'svta-cml');
	});
});
