import type { WebVttCue, WebVttParsingError, WebVttRegion } from '@svta/common-media-library/webvtt';
import { WebVttParser } from '@svta/common-media-library/webvtt';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import './utils/pollyfill.ts';

describe('WebVttParser examples', () => {
	it('provides a valid example', async () => {
		//#region example
		const vtt = `WEBVTT\n\nREGION\nid:test\n\nSTYLE\n::cue {}\n\nCUE_1\n00:00:00.000 --> 00:00:35.000\nWevVTT Sample\n`;
		const cues = [] as WebVttCue[];
		const errors = [] as WebVttParsingError[];
		const regions = [] as WebVttRegion[];
		const styles = [] as string[];

		const parser = new WebVttParser();
		parser.oncue = cue => cues.push(cue);
		parser.onparsingerror = error => errors.push(error);
		parser.onregion = region => regions.push(region);
		parser.onstyle = style => styles.push(style);
		parser.parse(vtt);
		parser.flush();

		assert(cues[0].id === 'CUE_1');
		assert(cues[0].text === 'WevVTT Sample');
		assert(errors.length === 0);
		assert(regions[0].id === 'test');
		assert(styles.length === 1);
		//#endregion example
	});
});
