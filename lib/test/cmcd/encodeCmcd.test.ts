import { encodeCmcd } from '@svta/common-media-library/cmcd/encodeCmcd';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { CMCD_INPUT } from './data/CMCD_INPUT.js';
import { CMCD_STRING } from './data/CMCD_STRING.js';

describe('encodeCmcd', () => {
	it('handles null data object', () => {
		equal(encodeCmcd(null as any), '');
	});

	it('returns encoded string', () => {
		equal(encodeCmcd(CMCD_INPUT), CMCD_STRING);
	});
});
