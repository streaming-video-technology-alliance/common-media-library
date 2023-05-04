import { fromCmcdQuery } from '@svta.org/common-media-library';
import { deepEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { CMCD_OUTPUT } from './data/CMCD_OUTPUT.js';
import { CMCD_QUERY } from './data/CMCD_QUERY.js';

describe('fromCmcdQuery', () => {
	it('produces CMCD object', () => {
		deepEqual(fromCmcdQuery(CMCD_QUERY), CMCD_OUTPUT);
	});
});
