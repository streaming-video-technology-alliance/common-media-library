import { isId3TimestampFrame } from '@svta/common-media-library';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { PTS_FRAME } from './data/PTS.js';

describe('isId3TimestampFrame', () => {
	it('detects timestamp', () => {
		equal(isId3TimestampFrame(PTS_FRAME), true);
	});
});
