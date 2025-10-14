import { describe, it } from 'node:test'
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts'

describe('cuetext/lang tests', () => {

	it('no-end-gt.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/lang/no-end-gt.vtt', './test/webvtt/cuetext/lang/no-end-gt.json')
	})

	it('not-closed.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/lang/not-closed.vtt', './test/webvtt/cuetext/lang/not-closed.json')
	})

	it('with-annotation.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/lang/with-annotation.vtt', './test/webvtt/cuetext/lang/with-annotation.json')
	})

	it('with-closing-span.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/lang/with-closing-span.vtt', './test/webvtt/cuetext/lang/with-closing-span.json')
	})

	it('with-no-annotation.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/lang/with-no-annotation.vtt', './test/webvtt/cuetext/lang/with-no-annotation.json')
	})

	it('with-subclass.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/lang/with-subclass.vtt', './test/webvtt/cuetext/lang/with-subclass.json')
	})

	it('with-two-subclasses.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/lang/with-two-subclasses.vtt', './test/webvtt/cuetext/lang/with-two-subclasses.json')
	})

})
