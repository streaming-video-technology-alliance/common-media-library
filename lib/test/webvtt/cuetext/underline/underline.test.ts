import { describe, it } from 'node:test';
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts';

describe('cuetext/underline tests', () => {

	it('not-closed.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/underline/not-closed.vtt', './test/webvtt/cuetext/underline/not-closed.json');
	});

	it('with-annotation.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/underline/with-annotation.vtt', './test/webvtt/cuetext/underline/with-annotation.json');
	});

	it('with-closing-span.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/underline/with-closing-span.vtt', './test/webvtt/cuetext/underline/with-closing-span.json');
	});

	it('with-subclass.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/underline/with-subclass.vtt', './test/webvtt/cuetext/underline/with-subclass.json');
	});

	it('with-two-subclasses.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/underline/with-two-subclasses.vtt', './test/webvtt/cuetext/underline/with-two-subclasses.json');
	});

});
