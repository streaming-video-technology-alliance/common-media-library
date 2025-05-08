import { dataViewToString, UTF_8 } from '@svta/common-media-library';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { strToCodes } from './strToCodes.ts';

describe('dataViewToString', () => {
	it('converts UTF-8 DataView to string', () => {
		// #region example
		const str = 'hello world';
		const codes = strToCodes(str);
		const buffer = new ArrayBuffer(codes.length);
		const dataView = new DataView(buffer);

		// Fill DataView with string data
		for (let i = 0; i < codes.length; i++) {
			dataView.setUint8(i, codes[i]);
		}

		equal(dataViewToString(dataView, UTF_8), str);
		// #endregion example
	});

	it('converts DataView to string with default UTF-8 encoding', () => {
		const str = 'default encoding test';
		const codes = strToCodes(str);
		const buffer = new ArrayBuffer(codes.length);
		const dataView = new DataView(buffer);

		for (let i = 0; i < codes.length; i++) {
			dataView.setUint8(i, codes[i]);
		}

		// Test with default encoding parameter
		equal(dataViewToString(dataView), str);
	});

	it('handles special characters in UTF-8', () => {
		const str = 'Special chars: !@#$%^&*()_+{}|:"<>?';
		const encoder = new TextEncoder();
		const utf8Bytes = encoder.encode(str);
		const buffer = new ArrayBuffer(utf8Bytes.length);
		const dataView = new DataView(buffer);

		for (let i = 0; i < utf8Bytes.length; i++) {
			dataView.setUint8(i, utf8Bytes[i]);
		}

		equal(dataViewToString(dataView, UTF_8), str);
	});

	it('handles empty DataView', () => {
		const emptyBuffer = new ArrayBuffer(0);
		const emptyDataView = new DataView(emptyBuffer);

		equal(dataViewToString(emptyDataView, UTF_8), '');
	});

	it('handles multi-byte UTF-8 characters', () => {
		const str = 'UTF-8 multi-byte: 😀🚀🌟';
		const encoder = new TextEncoder();
		const utf8Bytes = encoder.encode(str);
		const buffer = new ArrayBuffer(utf8Bytes.length);
		const dataView = new DataView(buffer);

		for (let i = 0; i < utf8Bytes.length; i++) {
			dataView.setUint8(i, utf8Bytes[i]);
		}

		equal(dataViewToString(dataView, UTF_8), str);
	});
});
