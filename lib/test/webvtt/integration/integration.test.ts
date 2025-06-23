import { describe, it } from 'node:test';
import { expectCuesEqualAll } from '../utils/expectCuesEqualAll.ts';

describe('integration tests', () => {

	it('arrows.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/integration/arrows.vtt', './test/webvtt/integration/arrows.json');
	});

	it('cue-content-class.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/integration/cue-content-class.vtt', './test/webvtt/integration/cue-content-class.json');
	});

	it('cue-content.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/integration/cue-content.vtt', './test/webvtt/integration/cue-content.json');
	});

	it('cue-identifier.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/integration/cue-identifier.vtt', './test/webvtt/integration/cue-identifier.json');
	});

	// Turn back on: https://github.com/mozilla/vtt.js/issues/262
	it('cycle-collector-talk.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/integration/cycle-collector-talk.vtt', './test/webvtt/integration/cycle-collector-talk.json');
	});

	// Turn back on: https://github.com/mozilla/vtt.js/issues/262
	it('id.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/integration/id.vtt', './test/webvtt/integration/id.json');
	});

	// Turn back on: https://github.com/mozilla/vtt.js/issues/262
	it('not-only-nested-cues.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/integration/not-only-nested-cues.vtt', './test/webvtt/integration/not-only-nested-cues.json');
	});

	// Turn back on: https://github.com/mozilla/vtt.js/issues/262
	it('one-line-comment.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/integration/one-line-comment.vtt', './test/webvtt/integration/one-line-comment.json');
	});

	// Turn back on: https://github.com/mozilla/vtt.js/issues/262
	it('only-nested-cues.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/integration/only-nested-cues.vtt', './test/webvtt/integration/only-nested-cues.json');
	});

	// Turn back on: https://github.com/mozilla/vtt.js/issues/262
	it('spec-example.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/integration/spec-example.vtt', './test/webvtt/integration/spec-example.json');
	});

});
