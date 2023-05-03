import { toCmcdQuery } from '@svta.org/common-media-library';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { cmcdData } from './cmcdData.js';
import { cmcdString } from './cmcdString.js';

describe('toCmcdQuery', () => {
	it('handles null data object', () => {
		equal(toCmcdQuery(null as any), '');
	});

	it('returns encoded query string', () => {
		equal(toCmcdQuery(cmcdData), `CMCD=${encodeURIComponent(cmcdString)}`);
	});
});
