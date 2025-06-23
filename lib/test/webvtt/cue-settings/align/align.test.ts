import { describe, it } from 'node:test';
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts';

describe('cue-settings/align tests', () => {

	it('bad-align.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/align/bad-align.vtt', './test/webvtt/cue-settings/align/bad-align.json');
	});

	it('bad-delimiter.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/align/bad-delimiter.vtt', './test/webvtt/cue-settings/align/bad-align.json');
	});

	it('bogus-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/align/bogus-value.vtt', './test/webvtt/cue-settings/align/bad-align.json');
	});

	it('capital-keyword.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/align/capital-keyword.vtt', './test/webvtt/cue-settings/align/bad-align.json');
	});

	it('keyword-end.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/align/keyword-end.vtt', './test/webvtt/cue-settings/align/keyword-end.json');
	});

	it('keyword-left.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/align/keyword-left.vtt', './test/webvtt/cue-settings/align/keyword-left.json');
	});

	it('keyword-middle.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/align/keyword-middle.vtt', './test/webvtt/cue-settings/align/keyword-middle.json');
	});

	it('keyword-right.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/align/keyword-right.vtt', './test/webvtt/cue-settings/align/keyword-right.json');
	});

	it('keyword-start.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/align/keyword-start.vtt', './test/webvtt/cue-settings/align/keyword-start.json');
	});

	it('no-value.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/align/no-value.vtt', './test/webvtt/cue-settings/align/bad-align.json');
	});

	it('space-after-delimiter.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/align/space-after-delimiter.vtt', './test/webvtt/cue-settings/align/bad-align.json');
	});

	it('space-before-delimiter.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-settings/align/space-before-delimiter.vtt', './test/webvtt/cue-settings/align/bad-align.json');
	});

});
