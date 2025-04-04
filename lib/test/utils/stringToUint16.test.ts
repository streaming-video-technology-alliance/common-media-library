import { stringToUint16 } from '@svta/common-media-library';
import { deepEqual } from 'node:assert';
import { describe, it } from 'node:test';

describe('stringToUint16', () => {
	it('provides a valid example', async () => {
		//#region example
		const result = stringToUint16('hello world')

		deepEqual(result, new Uint16Array([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]));
		//#endregion example
	});
});
