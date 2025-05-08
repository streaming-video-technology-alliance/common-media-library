import { arrayBufferToString, UTF_16, UTF_8 } from '@svta/common-media-library';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { strToCodes } from './strToCodes.ts';

describe('arrayBufferToString', () => {
	it('converts UTF-8 ArrayBuffer to string', () => {
		// #region example
		const str = 'hello world';
		const utf8 = new Uint8Array(strToCodes(str));
		equal(arrayBufferToString(utf8.buffer, UTF_8), str);
		// #endregion example
	});

	it('converts UTF-16 ArrayBuffer to string', () => {
		const str = 'hello world with UTF-16 characters: 😀🚀🌟';

		function stringToUtf16Buffer(str: string): ArrayBuffer {
			const buffer = new ArrayBuffer(str.length * 2);
			const view = new DataView(buffer);
			for (let i = 0; i < str.length; i++) {
				view.setUint16(i * 2, str.charCodeAt(i), true); // true for little-endian
			}
			return buffer;
		}

		// Convert to UTF-16
		const utf16 = stringToUtf16Buffer(str);

		equal(arrayBufferToString(utf16, UTF_16), str);
	});

	it('handles empty strings', () => {
		const emptyUtf8 = new Uint8Array(0);
		equal(arrayBufferToString(emptyUtf8.buffer, UTF_8), '');

		const emptyUtf16 = new Uint16Array(0);
		equal(arrayBufferToString(emptyUtf16.buffer, UTF_16), '');
	});

	it('handles special characters in UTF-8', () => {
		const str = 'Special chars: !@#$%^&*()_+{}|:"<>?';
		const utf8 = new TextEncoder().encode(str);
		equal(arrayBufferToString(utf8.buffer as ArrayBuffer, UTF_8), str);
	});
});
