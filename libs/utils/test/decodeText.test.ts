import { decodeText, stringToUint16, UTF_16, UTF_8 } from '@svta/cml-utils';
import { equal } from 'node:assert';
import { it } from 'node:test';
import { decoderTest } from './decoderTest.ts';
import { strToCodes } from './strToCodes.ts';

decoderTest('decodeText', () => {
	it('converts UTF-8 ArrayBuffer to string', () => {
		// #region example
		const str = 'hello world';
		const utf8 = new Uint8Array(strToCodes(str));
		equal(decodeText(utf8.buffer, { encoding: UTF_8 }), str);
		// #endregion example
	});

	it('converts UTF-16 ArrayBuffer to string', () => {
		const str = 'hello world with UTF-16 characters: 😀🚀🌟';
		const utf16 = stringToUint16(str);

		equal(decodeText(utf16, { encoding: UTF_16 }), str);
	});

	it('handles empty strings', () => {
		const emptyUtf8 = new Uint8Array(0);
		equal(decodeText(emptyUtf8.buffer, { encoding: UTF_8 }), '');

		const emptyUtf16 = new Uint16Array(0);
		equal(decodeText(emptyUtf16.buffer, { encoding: UTF_16 }), '');
	});

	it('handles special characters in UTF-8', () => {
		const str = 'Special chars: !@#$%^&*()_+{}|:"<>?';
		const utf8 = new TextEncoder().encode(str);
		equal(decodeText(utf8.buffer as ArrayBuffer, { encoding: UTF_8 }), str);
	});

	it('auto detects UTF-8 encoding, no BOM', () => {
		const data = new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64]);
		const str = 'hello world';
		equal(decodeText(data.buffer as ArrayBuffer), str);
	});

	it('auto detects UTF-8 encoding, with BOM', () => {
		const data = new Uint8Array([0xef, 0xbb, 0xbf, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64]);
		equal(decodeText(data.buffer as ArrayBuffer), 'hello world');
	});

	it('handles multi-byte UTF-8 characters', () => {
		const str = 'aZ!©₿😀🚀🌟';
		const utf8Bytes = new TextEncoder().encode(str);
		equal(decodeText(utf8Bytes.buffer as ArrayBuffer, { encoding: UTF_8 }), str);
	});

	it('auto detects UTF-16 big endian encoding', () => {
		const data = new Uint8Array([0xfe, 0xff, 0x00, 0x68, 0x00, 0x65, 0x00, 0x6c, 0x00, 0x6c, 0x00, 0x6f, 0x00, 0x20, 0x00, 0x77, 0x00, 0x6f, 0x00, 0x72, 0x00, 0x6c, 0x00, 0x64]);
		equal(decodeText(data.buffer as ArrayBuffer), 'hello world');
	});

	it('auto detects UTF-16 little endian encoding', () => {
		const data = new Uint8Array([0xff, 0xfe, 0x68, 0x00, 0x65, 0x00, 0x6c, 0x00, 0x6c, 0x00, 0x6f, 0x00, 0x20, 0x00, 0x77, 0x00, 0x6f, 0x00, 0x72, 0x00, 0x6c, 0x00, 0x64, 0x00]);
		equal(decodeText(data.buffer as ArrayBuffer), 'hello world');
	});

	it('Handles UTF-8 DataView with byte offset and length', () => {
		const data = new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64]);
		const view = new DataView(data.buffer, 3, 5);
		equal(decodeText(view), 'lo wo');
	});

	it('Handles UTF-16 DataView with byte offset and length', () => {
		const data = new Uint8Array([0xff, 0xfe, 0x68, 0x00, 0x65, 0x00, 0x6c, 0x00, 0x6c, 0x00, 0x6f, 0x00, 0x20, 0x00, 0x77, 0x00, 0x6f, 0x00, 0x72, 0x00, 0x6c, 0x00, 0x64, 0x00]);
		const view = new DataView(data.buffer, 8, 10);
		equal(decodeText(view, { encoding: UTF_16 }), 'lo wo');
	});

	it('Handles Uint8Array with byte offset and length', () => {
		const data = new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64]);
		const view = data.subarray(3, 8);
		equal(decodeText(view), 'lo wo');
	});
});
