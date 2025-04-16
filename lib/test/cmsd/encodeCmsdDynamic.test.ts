import { encodeCmsdDynamic } from '@svta/common-media-library/cmsd/encodeCmsdDynamic';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { CMSD_DYNAMIC_LIST } from './data/CMSD_DYNAMIC_LIST.ts';
import { CMSD_DYNAMIC_OBJ } from './data/CMSD_DYNAMIC_OBJ.ts';
import { CMSD_DYNAMIC_SINGLE } from './data/CMSD_DYNAMIC_SINGLE.ts';

describe('encodeCmsdDynamic', () => {
	it('handles null value object', () => {
		// @ts-expect-error
		equal(encodeCmsdDynamic(null), '');
	});

	it('handles null param object', () => {
		// @ts-expect-error
		equal(encodeCmsdDynamic('test', null), '');
	});

	it('encodes a list of objects', () => {
		equal(encodeCmsdDynamic(CMSD_DYNAMIC_OBJ), CMSD_DYNAMIC_LIST);
	});

	it('encodes a single object', () => {
		const { value, params } = CMSD_DYNAMIC_OBJ[0];
		equal(encodeCmsdDynamic(value as string, params as any), CMSD_DYNAMIC_SINGLE);
	});
});
