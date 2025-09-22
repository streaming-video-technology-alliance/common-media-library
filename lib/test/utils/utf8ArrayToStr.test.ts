import { utf8ArrayToStr } from '@svta/common-media-library';
import { equal } from 'node:assert';
import { it } from 'node:test';
import { decoderTest } from './decoderTest.ts';
import { strToCodes } from './strToCodes.ts';

decoderTest('utf8ArrayToStr', () => {
	it('produces string', () => {
		const str = 'hello world';
		const utf8 = new Uint8Array(strToCodes(str));
		equal(utf8ArrayToStr(utf8), str);
	});

	it('handles multi-byte UTF-8 characters', () => {
		const str = 'aZ!©₿😀🚀🌟';
		const utf8Bytes = new TextEncoder().encode(str) as Uint8Array<ArrayBuffer>;
		equal(utf8ArrayToStr(utf8Bytes), str);
	});
});
