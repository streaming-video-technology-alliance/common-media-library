import { describe, it } from 'node:test'
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts'

describe('cuetext/italic tests', () => {

	it('not-closed.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/italic/not-closed.vtt', './test/webvtt/cuetext/italic/not-closed.json')
	})

	it('with-annotation.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/italic/with-annotation.vtt', './test/webvtt/cuetext/italic/with-annotation.json')
	})

	it('with-closing-span.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/italic/with-closing-span.vtt', './test/webvtt/cuetext/italic/with-closing-span.json')
	})

	it('with-subclass.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/italic/with-subclass.vtt', './test/webvtt/cuetext/italic/with-subclass.json')
	})

	it('with-two-subclasses.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/italic/with-two-subclasses.vtt', './test/webvtt/cuetext/italic/with-two-subclasses.json')
	})

})
