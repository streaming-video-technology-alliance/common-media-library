import { describe, it } from 'node:test';
import { expectCuesEqualAll } from '../utils/expectCuesEqualAll.ts';

describe('file-layout tests', function () {

	it('blank-file-with-bom.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/file-layout/blank-file-with-bom.vtt', './test/webvtt/file-layout/no-output.json');
	});

	it('blank-file.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/file-layout/blank-file.vtt', './test/webvtt/file-layout/no-output.json');
	});

	it('bom-garbage-data.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/file-layout/bom-garbage-data.vtt', './test/webvtt/file-layout/no-output.json');
	});

	it('bom-tab-webvtt.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/file-layout/bom-tab-webvtt.vtt', './test/webvtt/file-layout/no-output.json');
	});

	// Turn back on: https://github.com/mozilla/vtt.js/issues/262
	it('cue-spacing.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/file-layout/cue-spacing.vtt', './test/webvtt/file-layout/cue-spacing.json');
	});

	it('garbage-signature.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/file-layout/garbage-signature.vtt', './test/webvtt/file-layout/no-output.json');
	});

	it('header-no-new-line.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/file-layout/header-no-new-line.vtt', './test/webvtt/file-layout/no-output.json');
	});

	// Turn back on: https://github.com/mozilla/vtt.js/issues/262
	it('many-comments.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/file-layout/many-comments.vtt', './test/webvtt/file-layout/many-comments.json');
	});

	it('newline-before-webvtt.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/file-layout/newline-before-webvtt.vtt', './test/webvtt/file-layout/no-output.json');
	});

	it('no-space-cue-times-cue-settings.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/file-layout/no-space-cue-times-cue-settings.vtt', './test/webvtt/file-layout/no-space-cue-times-cue-settings.json');
	});

	it('tab-after-bom-before-header.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/file-layout/tab-after-bom-before-header.vtt', './test/webvtt/file-layout/no-output.json');
	});

	it('webvtt-no-bom.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/file-layout/webvtt-no-bom.vtt', './test/webvtt/file-layout/with-data.json');
	});

	it('webvtt-space.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/file-layout/webvtt-space.vtt', './test/webvtt/file-layout/with-data.json');
	});

	it('webvtt-tab.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/file-layout/webvtt-tab.vtt', './test/webvtt/file-layout/with-data.json');
	});

	it('webvtt-with-bom.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/file-layout/webvtt-with-bom.vtt', './test/webvtt/file-layout/with-data.json');
	});

	it('bad-double-webvtt.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/file-layout/bad-double-webvtt.vtt', './test/webvtt/file-layout/no-output.json');
	});

});
