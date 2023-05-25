import { getId3Timestamp } from '@svta/common-media-library';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { PTS } from './data/PTS.js';

describe('getId3Timestamp', () => {
	it('returns timestamp', () => {
		equal(getId3Timestamp(PTS), 0);
	});
});
