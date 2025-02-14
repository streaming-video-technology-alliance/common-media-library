import { getId } from '@svta/common-media-library/drm/fairplay/getId';
import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

describe('getId', () => {
	it('extracts query param when provided', () => {
		const laUrl = 'https://common-media-library.com?videoId=svta-cml';
		const initData = new Uint16Array();

		strictEqual(getId(laUrl, initData, 'videoId'), 'svta-cml');
	});
});
