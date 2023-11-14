import { encodeCmcd } from '@svta/common-media-library/cmcd/encodeCmcd';
import { SfToken } from '@svta/common-media-library/structuredfield/SfToken';
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

	it('returns encoded string when SfToken is used', () => {
		const input = Object.assign({}, CMCD_INPUT, { 'com.example-token': new SfToken('s') });
		equal(encodeCmcd(input), CMCD_STRING);
	});
});
