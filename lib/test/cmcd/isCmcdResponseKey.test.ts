import { CMCD_REQUEST_KEYS, CMCD_RESPONSE_KEYS, isCmcdResponseKey } from '@svta/common-media-library/cmcd';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('isCmcdResponseKey', () => {
	it('provides a valid example', () => {
		//#region example
		equal(isCmcdResponseKey('url'), true);
		equal(isCmcdResponseKey('e'), false);
		//#endregion example
	});

	it('Rejects all request keys', () => {
		for (const key of CMCD_REQUEST_KEYS) {
			equal(isCmcdResponseKey(key), false);
		}
	});

	it('Accepts all response keys', () => {
		for (const key of CMCD_RESPONSE_KEYS) {
			equal(isCmcdResponseKey(key), true);
		}
	});

	it('Rejects custom keys', () => {
		equal(isCmcdResponseKey('com.hello.world-foo'), false);
	});

	it('Rejects invalid keys', () => {
		equal(isCmcdResponseKey('nrr'), false);
		equal(isCmcdResponseKey('e'), false);
	});
});
