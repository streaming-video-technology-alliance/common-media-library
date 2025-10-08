import { CMCD_REQUEST_KEYS, isCmcdRequestKey } from '@svta/cml-cmcd';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('isCmcdRequestKey', () => {
	it('provides a valid example', () => {
		//#region example
		equal(isCmcdRequestKey('br'), true);
		equal(isCmcdRequestKey('e'), false);
		//#endregion example
	});

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
