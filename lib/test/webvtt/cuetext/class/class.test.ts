import { describe, it } from 'node:test';
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts';

describe('cuetext/class tests', () => {

	it('not-closed.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/class/not-closed.vtt', './test/webvtt/cuetext/class/not-closed.json');
	});

	it('with-annotation.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/class/with-annotation.vtt', './test/webvtt/cuetext/class/with-annotation.json');
	});

	it('with-closing-span.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/class/with-closing-span.vtt', './test/webvtt/cuetext/class/with-closing-span.json');
	});

	it('with-subclass.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/class/with-subclass.vtt', './test/webvtt/cuetext/class/with-subclass.json');
	});

	it('with-two-subclasses.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/class/with-two-subclasses.vtt', './test/webvtt/cuetext/class/with-two-subclasses.json');
	});

});
