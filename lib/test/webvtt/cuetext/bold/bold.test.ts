import { describe, it } from 'node:test';
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts';

describe('cuetext/bold tests', () => {

	it('not-closed.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/bold/not-closed.vtt', './test/webvtt/cuetext/bold/not-closed.json');
	});

	it('with-annotation.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/bold/with-annotation.vtt', './test/webvtt/cuetext/bold/with-annotation.json');
	});

	it('with-closing-span.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/bold/with-closing-span.vtt', './test/webvtt/cuetext/bold/with-closing-span.json');
	});

	it('with-subclass.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/bold/with-subclass.vtt', './test/webvtt/cuetext/bold/with-subclass.json');
	});

	it('with-two-subclasses.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/bold/with-two-subclasses.vtt', './test/webvtt/cuetext/bold/with-two-subclasses.json');
	});

});
