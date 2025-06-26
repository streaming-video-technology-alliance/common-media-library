import { encodeCmcd } from '@svta/common-media-library/cmcd/encodeCmcd';
import { SfToken } from '@svta/common-media-library/structuredfield/SfToken';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { CMCD_INPUT } from './data/CMCD_INPUT.ts';
import { CMCD_STRING } from './data/CMCD_STRING.ts';

describe('encodeCmcd', () => {
	it('handles null data object', () => {
		equal(encodeCmcd(null as any), '');
	});

	it('ignore invalid values', () => {
		// @ts-expect-error
		equal(encodeCmcd({ mtp: NaN, br: Infinity, nor: '', sid: undefined, cid: null, su: false }), '');
	});

	it('returns encoded string', () => {
		equal(encodeCmcd(CMCD_INPUT), CMCD_STRING);
	});

	it('filters keys', () => {
		equal(encodeCmcd(CMCD_INPUT, { filter: key => key === 'cid' }), 'cid="content-id"');
	});

	it('returns encoded string when SfToken is used', () => {
		const input = Object.assign({}, CMCD_INPUT, { 'com.example-token': new SfToken('s') });
		equal(encodeCmcd(input), CMCD_STRING);
	});

	it('returns converts to relative path when baseUrl is provided', () => {
		const input = {
			nor: 'http://test.com/base/segments/video/1.mp4',
		};
		const options = {
			baseUrl: 'http://test.com/base/manifest/manifest.mpd',
		};
		equal(encodeCmcd(input, options), 'nor="..%2Fsegments%2Fvideo%2F1.mp4"');
	});
});
