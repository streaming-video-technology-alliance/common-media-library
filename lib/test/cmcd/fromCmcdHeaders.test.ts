import { fromCmcdHeaders } from '@svta/common-media-library';
import { deepEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { CMCD_HEADERS } from './data/CMCD_HEADERS.ts';
import { CMCD_OUTPUT } from './data/CMCD_OUTPUT.ts';

describe('fromCmcdHeaders', () => {
	it('produces CMCD object', () => {
		deepEqual(fromCmcdHeaders(CMCD_HEADERS), CMCD_OUTPUT);
	});
});
