import { toCmcdQuery } from '@svta/common-media-library';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { CMCD_INPUT } from './data/CMCD_INPUT.ts';
import { CMCD_QUERY } from './data/CMCD_QUERY.ts';

describe('toCmcdQuery', () => {
	it('handles null data object', () => {
		equal(toCmcdQuery(null as any), '');
	});

	it('returns encoded query string', () => {
		equal(toCmcdQuery(CMCD_INPUT), CMCD_QUERY);
	});
});
