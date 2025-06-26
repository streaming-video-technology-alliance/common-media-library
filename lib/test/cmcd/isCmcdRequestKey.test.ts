import { CMCD_REQUEST_KEYS, isCmcdRequestKey } from '@svta/common-media-library';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('isCmcdRequestKey', () => {
	it('Accepts all request keys', () => {
		for (const key of CMCD_REQUEST_KEYS) {
			equal(isCmcdRequestKey(key), true);
		}
	});

	it('Accepts custom keys', () => {
		equal(isCmcdRequestKey('com.hello.world-foo'), true);
	});

	it('Rejects invalid keys', () => {
		equal(isCmcdRequestKey('nrr'), false);
		equal(isCmcdRequestKey('e'), false);
	});
});
