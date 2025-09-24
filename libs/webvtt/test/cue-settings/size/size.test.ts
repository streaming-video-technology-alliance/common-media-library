import { describe, it } from 'node:test';
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts';

describe('cue-settings/size tests', () => {

	it('bad-delimiter.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/size/bad-delimiter.vtt', './test/webvtt/cue-settings/size/bad-size.json');
	});

	it('bad-size.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/size/bad-size.vtt', './test/webvtt/cue-settings/size/bad-size.json');
	});

	it('bogus-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/size/bogus-value.vtt', './test/webvtt/cue-settings/size/bad-size.json');
	});

	it('decimal-percent.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/size/decimal-percent.vtt', './test/webvtt/cue-settings/size/decimal-percent.json');
	});

	it('integer-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/size/integer-value.vtt', './test/webvtt/cue-settings/size/bad-size.json');
	});

	it('just-percent-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/size/just-percent-value.vtt', './test/webvtt/cue-settings/size/bad-size.json');
	});

	it('negative-percent-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/size/negative-percent-value.vtt', './test/webvtt/cue-settings/size/bad-size.json');
	});

	it('no-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/size/no-value.vtt', './test/webvtt/cue-settings/size/bad-size.json');
	});

	it('percent-before-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/size/percent-before-value.vtt', './test/webvtt/cue-settings/size/bad-size.json');
	});

	it('percent-over.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/size/percent-over.vtt', './test/webvtt/cue-settings/size/bad-size.json');
	});

	it('percent-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/size/percent-value.vtt', './test/webvtt/cue-settings/size/percent-value.json');
	});

	it('space-after-delimiter.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/size/space-after-delimiter.vtt', './test/webvtt/cue-settings/size/bad-size.json');
	});

	it('space-before-delimiter.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/size/space-before-delimiter.vtt', './test/webvtt/cue-settings/size/bad-size.json');
	});

});
