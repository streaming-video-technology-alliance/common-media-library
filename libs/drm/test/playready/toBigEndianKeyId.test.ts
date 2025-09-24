import { toBigEndianKeyId } from '@svta/common-media-library/drm';
import { arrayBufferToUuid, uuidToArrayBuffer } from '@svta/common-media-library/utils';
import { equal } from 'assert/strict';
import { describe, it } from 'node:test';

describe('toBigEndianKeyId', () => {
	it('should convert little-endian key ID to big-endian format', () => {
		//#region example
		const littleEndianKeyId = 'a0564af7-60c2-d94b-9610-c7ae70d5d970';
		const expectedBigEndianKeyId = 'f74a56a0-c260-4bd9-9610-c7ae70d5d970';

		const inputBuffer = uuidToArrayBuffer(littleEndianKeyId);
		const result = toBigEndianKeyId(inputBuffer);
		const resultHex = arrayBufferToUuid(result);

		equal(resultHex, expectedBigEndianKeyId);
		//#endregion example
	});

	it('should return the same buffer if not 16 bytes', () => {
		const shortBuffer = new ArrayBuffer(8);
		const result = toBigEndianKeyId(shortBuffer);

		equal(result, shortBuffer);
	});

	it('should return the same buffer if longer than 16 bytes', () => {
		const longBuffer = new ArrayBuffer(32);
		const result = toBigEndianKeyId(longBuffer);

		equal(result, longBuffer);
	});
});
