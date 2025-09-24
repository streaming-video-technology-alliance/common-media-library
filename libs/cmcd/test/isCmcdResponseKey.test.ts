import { CMCD_REQUEST_KEYS, CMCD_RESPONSE_KEYS, isCmcdResponseKey } from '@svta/common-media-library/cmcd';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('isCmcdRequestKey', () => {
	it('provides a valid example', () => {
		//#region example
		equal(isCmcdResponseKey('br'), true);
		equal(isCmcdResponseKey('e'), false);
		//#endregion example
	});

	it('Accepts all request keys', () => {
		for (const key of CMCD_REQUEST_KEYS) {
			equal(isCmcdResponseKey(key), true);
		}
	});

	it('Accepts all response keys', () => {
		for (const key of CMCD_RESPONSE_KEYS) {
			equal(isCmcdResponseKey(key), true);
		}
	});

	it('Accepts custom keys', () => {
		equal(isCmcdResponseKey('com.hello.world-foo'), true);
	});

	it('Rejects invalid keys', () => {
		equal(isCmcdResponseKey('nrr'), false);
		equal(isCmcdResponseKey('e'), false);
	});
});
