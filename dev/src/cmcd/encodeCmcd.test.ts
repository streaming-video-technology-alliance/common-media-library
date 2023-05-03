import { encodeCmcd } from '@svta.org/common-media-library/cmcd/encodeCmcd';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { cmcdData } from './cmcdData.js';
import { cmcdString } from './cmcdString.js';

describe('encodeCmcd', () => {
	it('handles null data object', () => {
		equal(encodeCmcd(null as any), '');
	});

	it('returns encoded string', () => {
		equal(encodeCmcd(cmcdData), cmcdString);
	});
});
