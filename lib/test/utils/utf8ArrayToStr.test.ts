import { utf8ArrayToStr } from '@svta/common-media-library';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { strToCodes } from './strToCodes.ts';

describe('utf8ArrayToStr', () => {
	it('produces string', () => {
		const str = 'hello world';
		const utf8 = new Uint8Array(strToCodes(str));
		equal(utf8ArrayToStr(utf8), str);
	});
});
