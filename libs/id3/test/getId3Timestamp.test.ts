import { getId3Timestamp } from '@svta/cml-id3/getId3Timestamp';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { PTS } from './data/PTS.ts';

describe('getId3Timestamp', () => {
	it('returns timestamp', () => {
		equal(getId3Timestamp(PTS), 0);
	});
});
