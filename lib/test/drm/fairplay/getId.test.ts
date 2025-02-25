import { getId } from '@svta/common-media-library/drm/fairplay/getId';
import { convertUint8ToUint16 } from '@svta/common-media-library/utils/convertUint8ToUint16';
import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

describe('getId', () => {
	it('extracts contentId from skd:// format', () => {
		const laUrl = 'https://common-media-library.com';
		const initDataString = 'skd://common-media-library.com/asset1234';
		const initData = convertUint8ToUint16(new TextEncoder().encode(initDataString));

		strictEqual(getId(laUrl, initData), 'common-media-library.com/asset1234');
	});
	
	it('extracts query param when provided', () => {
		const laUrl = 'https://common-media-library.com?videoId=svta-cml';
		const initData = new Uint16Array();

		strictEqual(getId(laUrl, initData, 'videoId'), 'svta-cml');
	});
});
