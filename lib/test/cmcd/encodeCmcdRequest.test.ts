import { encodeCmcdRequest } from '@svta/common-media-library/cmcd';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('encodeCmcdRequest', () => {
	it('handles null data object', () => {
		equal(encodeCmcdRequest(null as any), '');
	});

	it('ignore invalid values', () => {
		// @ts-expect-error
		equal(encodeCmcdRequest({ nrr: '0-100', mtp: NaN, br: Infinity, nor: '', sid: undefined, cid: null, su: false }), '');
	});

	it('returns encoded string', () => {
		equal(encodeCmcdRequest({
			ec: '10234',
		}), 'ec="10234"');
	});

	it('honors user filter', () => {
		equal(encodeCmcdRequest({
			br: 1000,
			ec: '10234',
		}, { filter: key => key === 'ec' }), 'ec="10234"');
	});
});
