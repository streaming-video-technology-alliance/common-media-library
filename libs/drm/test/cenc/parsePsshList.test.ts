import { parsePsshList } from '@svta/common-media-library/drm/cenc/parsePsshList.js';
import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { samplePsshBox } from '../common/samplePsshBox.ts';

describe('parsePsshList', () => {
	it('should return an object with the correct UUID and PSSH box', () => {
		//#region example
		const initData = new Uint8Array(samplePsshBox).buffer;
		const result = parsePsshList(initData);
		//#endregion example
		const expectedUUID = '1077efec-c0b2-4d02-ace3-3c1e52e2fb4b';

		strictEqual(Object.keys(result).length, 1); // should have one key
		strictEqual(Object.keys(result)[0], expectedUUID);

		const psshBox = result[expectedUUID];
		strictEqual(psshBox.byteLength, samplePsshBox.length); // length should match
		deepStrictEqual(new Uint8Array(psshBox), samplePsshBox);  // actual data should match
	});
});
