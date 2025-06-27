import { CMCD_REQUEST_KEYS, isCmcdResponseKey } from '@svta/common-media-library';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('isCmcdRequestKey', () => {
	it('Accepts all request keys', () => {
		for (const key of CMCD_REQUEST_KEYS) {
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
