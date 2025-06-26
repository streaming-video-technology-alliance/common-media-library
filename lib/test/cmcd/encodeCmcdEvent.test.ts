import { CmcdEventType, encodeCmcdEvent } from '@svta/common-media-library/cmcd';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';

describe('encodeCmcdEvent', () => {
	it('handles null data object', () => {
		equal(encodeCmcdEvent(null as any), '');
	});

	it('ignore invalid values', () => {
		// @ts-expect-error
		equal(encodeCmcdEvent({ nrr: '0-100', mtp: NaN, br: Infinity, nor: '', sid: undefined, cid: null, su: false }), '');
	});

	it('returns encoded string', () => {
		equal(encodeCmcdEvent({
			e: CmcdEventType.PLAY_STATE,
		}), 'e=ps');
	});

	it('honors user filter', () => {
		equal(encodeCmcdEvent({
			br: 1000,
			e: CmcdEventType.PLAY_STATE,
		}, { filter: key => key === 'e' }), 'e=ps');
	});
});
