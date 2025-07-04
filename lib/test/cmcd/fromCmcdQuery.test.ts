import { fromCmcdQuery } from '@svta/common-media-library/cmcd';
import { deepEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { CMCD_OUTPUT } from './data/CMCD_OUTPUT.ts';
import { CMCD_QUERY } from './data/CMCD_QUERY.ts';

describe('fromCmcdQuery', () => {
	it('produces CMCD object', () => {
		deepEqual(fromCmcdQuery(CMCD_QUERY), CMCD_OUTPUT);
	});
});
