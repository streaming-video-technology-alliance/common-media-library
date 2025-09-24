import { CMCD_V1_KEYS, isCmcdV1Key } from '@svta/common-media-library';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('isCmcdV1Key', () => {
	it('provides a valid example', () => {
		//#region example
		equal(isCmcdV1Key('br'), true);
		equal(isCmcdV1Key('e'), false);
		//#endregion example
	});

	it('Accepts all v1 keys', () => {
		for (const key of CMCD_V1_KEYS) {
			equal(isCmcdV1Key(key), true);
		}
	});

	it('Accepts custom keys', () => {
		equal(isCmcdV1Key('com.hello.world-foo'), true);
	});

	it('Rejects invalid keys', () => {
		equal(isCmcdV1Key('test'), false);
	});
});
