import { encodeCmsdStatic } from '@svta/common-media-library/cmsd/encodeCmsdStatic';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { CMSD_STATIC_OBJ } from './data/CMSD_STATIC_OBJ.js';
import { CMSD_STATIC_STRING } from './data/CMSD_STATIC_STRING.js';

describe('encodeCmsdStatic', () => {
	it('handles null value object', () => {
		// @ts-expect-error
		equal(encodeCmsdStatic(null), '');
	});

	it('returns encoded string', () => {
		equal(encodeCmsdStatic(CMSD_STATIC_OBJ), CMSD_STATIC_STRING);
	});
});
