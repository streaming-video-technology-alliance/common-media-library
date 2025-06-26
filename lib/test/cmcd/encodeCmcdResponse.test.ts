import { encodeCmcdResponse } from '@svta/common-media-library/cmcd';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('encodeCmcdResponse', () => {
	it('handles null data object', () => {
		equal(encodeCmcdResponse(null as any), '');
	});

	it('ignore invalid values', () => {
		// @ts-expect-error
		equal(encodeCmcdResponse({ nrr: '0-100', e: 'p', mtp: NaN, br: Infinity, nor: '', sid: undefined, cid: null, su: false }), '');
	});

	it('returns encoded string', () => {
		equal(encodeCmcdResponse({
			ttfb: 10234,
		}), 'ttfb=10234');
	});

	it('honors user filter', () => {
		equal(encodeCmcdResponse({
			br: 1000,
			ec: '10234',
		}, { filter: key => key === 'ec' }), 'ec="10234"');
	});
});
