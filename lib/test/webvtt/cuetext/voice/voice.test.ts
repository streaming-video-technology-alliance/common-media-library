import { describe, it } from 'node:test';
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts';

describe('cuetext/voice tests', () => {

	it('no-end-gt.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/voice/no-end-gt.vtt', './test/webvtt/cuetext/voice/no-end-gt.json');
	});

	it('not-closed.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/voice/not-closed.vtt', './test/webvtt/cuetext/voice/not-closed.json');
	});

	it('with-annotation.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/voice/with-annotation.vtt', './test/webvtt/cuetext/voice/with-annotation.json');
	});

	it('with-closing-span.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/voice/with-closing-span.vtt', './test/webvtt/cuetext/voice/with-closing-span.json');
	});

	it('with-subclass.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/voice/with-subclass.vtt', './test/webvtt/cuetext/voice/with-subclass.json');
	});

	it('with-two-subclasses.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/voice/with-two-subclasses.vtt', './test/webvtt/cuetext/voice/with-two-subclasses.json');
	});

});
