import { encodeHex } from '@svta/common-media-library/utils';
import { equal } from 'assert/strict';
import { describe, it } from 'node:test';

describe('encodeHex', () => {
	it('should convert ArrayBuffer to hex string', () => {
		//#region example
		const data = new Uint8Array([
			160, 86, 74, 247,
			96, 194,
			217, 75,
			150, 16,
			199, 174, 112, 213, 217, 112,
		]);
		const result = encodeHex(data.buffer);

		equal(result, 'a0564af760c2d94b9610c7ae70d5d970');
		//#endregion example
	});

	it('should handle empty ArrayBuffer', () => {
		const buffer = new ArrayBuffer(0);
		const result = encodeHex(buffer);

		equal(result, '');
	});

	it('should handle mixed byte values', () => {
		const data = new Uint8Array([171, 18, 205, 52]);
		const result = encodeHex(data.buffer);

		equal(result, 'ab12cd34');
	});

	it('should pad single digit hex values with zero', () => {
		const data = new Uint8Array([1, 15, 16, 255]);
		const result = encodeHex(data.buffer);

		equal(result, '010f10ff');
	});
});
