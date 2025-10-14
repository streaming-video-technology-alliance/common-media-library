import { isId3TimestampFrame } from '@svta/cml-id3';
import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { PTS_FRAME } from './data/PTS.ts';

describe('isId3TimestampFrame', () => {
	it('detects timestamp', () => {
		equal(isId3TimestampFrame(PTS_FRAME), true);
	});
});
