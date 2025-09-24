import { decodeBase64 } from '@svta/common-media-library/utils';
import { deepEqual } from 'node:assert';
import { describe, it } from 'node:test';

describe('decodeBase64', () => {
	it('provides a valid example', async () => {
		//#region example
		const result = decodeBase64('SGVsbG8gV29ybGQ=');
		deepEqual(result, new Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100]));
		//#endregion example
	});
});
