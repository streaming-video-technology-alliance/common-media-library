import { describe, it } from 'node:test';
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts';

describe('cue-settings/position tests', () => {

	it('bad-delimiter.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/position/bad-delimiter.vtt', './test/webvtt/cue-settings/position/bad-position.json');
	});

	it('bad-position-align.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/position/bad-position-align.vtt', './test/webvtt/cue-settings/position/bad-position-align.json');
	});

	it('bad-position.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/position/bad-position.vtt', './test/webvtt/cue-settings/position/bad-position.json');
	});

	it('bad-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/position/bad-value.vtt', './test/webvtt/cue-settings/position/bad-position.json');
	});

	it('bogus-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/position/bogus-value.vtt', './test/webvtt/cue-settings/position/bad-position.json');
	});

	it('decimal-percent.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/position/decimal-percent.vtt', './test/webvtt/cue-settings/position/decimal-percent.json');
	});

	it('integer-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/position/integer-value.vtt', './test/webvtt/cue-settings/position/bad-position.json');
	});

	it('just-percent-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/position/just-percent-value.vtt', './test/webvtt/cue-settings/position/bad-position.json');
	});

	it('negative-percent-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/position/negative-percent-value.vtt', './test/webvtt/cue-settings/position/bad-position.json');
	});

	it('percent-over.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/position/percent-over.vtt', './test/webvtt/cue-settings/position/bad-position.json');
	});

	it('percent-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/position/percent-value.vtt', './test/webvtt/cue-settings/position/percent-value.json');
	});

	it('position-line-right-align.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/position/position-line-right-align.vtt', './test/webvtt/cue-settings/position/position-line-right-align.json');
	});

	it('position-line-left-align.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/position/position-line-left-align.vtt', './test/webvtt/cue-settings/position/position-line-left-align.json');
	});

	it('space-after-delimiter.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/position/space-after-delimiter.vtt', './test/webvtt/cue-settings/position/bad-position.json');
	});

	it('space-before-delimiter.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/position/space-before-delimiter.vtt', './test/webvtt/cue-settings/position/bad-position.json');
	});

});
