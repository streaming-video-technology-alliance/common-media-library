import { equal } from 'node:assert';
import { describe, it } from 'node:test';

import type { AudioTrack, Track } from '@svta/cml-cmaf-ham';

import { getTimescale } from '@svta/cml-cmaf-ham/mapper/dash/mapHamToDash/utils/getTimescale.js';

describe('getTimescale', () => {
	it('returns sampleRate if track is audio', () => {
		const res = getTimescale({
			type: 'audio',
			sampleRate: 48000,
		} as AudioTrack as Track);
		equal(res, 48000);
	});

	it('returns 90000 if track is video', () => {
		const res = getTimescale({
			type: 'video',
		} as Track);
		equal(res, 90000);
	});

	it('returns 1000 if track is text', () => {
		const res = getTimescale({
			type: 'text',
		} as Track);
		equal(res, 1000);
	});
});
