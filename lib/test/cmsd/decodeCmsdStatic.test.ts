import { decodeCmsdStatic } from '@svta/common-media-library/cmsd/decodeCmsdStatic';
import { deepEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { CMSD_STATIC_OBJ } from './data/CMSD_STATIC_OBJ.js';
import { CMSD_STATIC_STRING } from './data/CMSD_STATIC_STRING.js';

describe('decodeCmsdStatic', () => {
	it('handles null data object', () => {
		// @ts-expect-error
		deepEqual(decodeCmsdStatic(undefined), {});
		// @ts-expect-error
		deepEqual(decodeCmsdStatic(null), {});
	});

	it('handles empty string', () => {
		deepEqual(decodeCmsdStatic(''), {});
	});

	it('returns encoded string', () => {
		deepEqual(decodeCmsdStatic(CMSD_STATIC_STRING), CMSD_STATIC_OBJ);
	});
});
