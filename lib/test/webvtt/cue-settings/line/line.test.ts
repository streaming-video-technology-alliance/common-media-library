import { describe, it } from 'node:test';
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts';

describe('cue-settings/line tests', () => {

	it('bad-delimiter.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/line/bad-delimiter.vtt', './test/webvtt/cue-settings/line/bad-line.json');
	});

	it('bad-line-align.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/line/bad-line-align.vtt', './test/webvtt/cue-settings/line/bad-line-align.json');
	});

	it('bad-line.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/line/bad-line.vtt', './test/webvtt/cue-settings/line/bad-line.json');
	});

	it('bogus-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/line/bogus-value.vtt', './test/webvtt/cue-settings/line/bad-line.json');
	});

	it('dash-in-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/line/dash-in-value.vtt', './test/webvtt/cue-settings/line/bad-line.json');
	});

	it('decimal-percent.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/line/decimal-percent.vtt', './test/webvtt/cue-settings/line/decimal-percent.json');
	});

	// Turn back on issue: https://github.com/mozilla/vtt.js/issues/255
	it('integer-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/line/integer-value.vtt', './test/webvtt/cue-settings/line/integer-value.json');
	});

	// Turn back on issue: https://github.com/mozilla/vtt.js/issues/255
	it('large-integer-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/line/large-integer-value.vtt', './test/webvtt/cue-settings/line/large-integer-value.json');
	});

	it('line-end-align.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/line/line-end-align.vtt', './test/webvtt/cue-settings/line/line-end-align.json');
	});

	it('line-start-align.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/line/line-start-align.vtt', './test/webvtt/cue-settings/line/line-start-align.json');
	});

	// Turn back on issue: https://github.com/mozilla/vtt.js/issues/255
	it('negative-integer-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/line/negative-integer-value.vtt', './test/webvtt/cue-settings/line/negative-integer-value.json');
	});

	it('negative-percent-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/line/negative-percent-value.vtt', './test/webvtt/cue-settings/line/bad-line.json');
	});

	it('negative-zeros.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/line/negative-zeros.vtt', './test/webvtt/cue-settings/line/negative-zeros.json');
	});

	it('no-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/line/no-value.vtt', './test/webvtt/cue-settings/line/bad-line.json');
	});

	it('percent-in-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/line/percent-in-value.vtt', './test/webvtt/cue-settings/line/bad-line.json');
	});

	it('percent-over.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/line/percent-over.vtt', './test/webvtt/cue-settings/line/bad-line.json');
	});

	it('percent-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/line/percent-value.vtt', './test/webvtt/cue-settings/line/percent-value.json');
	});

	it('space-after-delimiter.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/line/space-after-delimiter.vtt', './test/webvtt/cue-settings/line/bad-line.json');
	});

	it('space-before-delimiter.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/line/space-before-delimiter.vtt', './test/webvtt/cue-settings/line/bad-line.json');
	});

});
