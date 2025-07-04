import { decodeCmcd } from '@svta/common-media-library/cmcd/decodeCmcd';
import { deepEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { CMCD_OUTPUT_REQUEST } from './data/CMCD_OUTPUT_REQUEST.ts';
import { CMCD_STRING_REQUEST } from './data/CMCD_STRING_REQUEST.ts';

describe('decodeCmcd', () => {
	it('handles null data object', () => {
		deepEqual(decodeCmcd(null as any), {});
	});

	it('handles empty string', () => {
		deepEqual(decodeCmcd(''), {});
	});

	it('returns encoded string', () => {
		deepEqual(decodeCmcd(CMCD_STRING_REQUEST), CMCD_OUTPUT_REQUEST);
	});
});
