import { parseWebVtt } from '@svta/common-media-library/webvtt/parseWebVtt.js';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import './utils/pollyfill.ts';

describe('parseWebVtt examples', () => {
	it('provides a valid example', async () => {
		//#region example
		const vtt = `WEBVTT\n\nREGION\nid:test\n\nSTYLE\n::cue {}\n\nCUE_1\n00:00:00.000 --> 00:00:35.000\nWevVTT Sample\n`;

		const { cues, errors, regions, styles } = parseWebVtt(vtt);

		assert(cues[0].id === 'CUE_1');
		assert(cues[0].text === 'WevVTT Sample');
		assert(errors.length === 0);
		assert(regions[0].id === 'test');
		assert(styles.length === 1);
		//#endregion example
	});
});
