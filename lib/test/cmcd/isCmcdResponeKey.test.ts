import { CMCD_REQUEST_KEYS, isCmcdResponeKey } from '@svta/common-media-library';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('isCmcdRequestKey', () => {
	it('Accepts all request keys', () => {
		for (const key of CMCD_REQUEST_KEYS) {
			equal(isCmcdResponeKey(key), true);
		}
	});

	it('Accepts custom keys', () => {
		equal(isCmcdResponeKey('com.hello.world-foo'), true);
	});

	it('Rejects invalid keys', () => {
		equal(isCmcdResponeKey('nrr'), false);
		equal(isCmcdResponeKey('e'), false);
	});
});
