import { describe, it } from 'node:test'
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts'

describe('cuetext/format tests', () => {

	it('double-line-break.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/format/double-line-break.vtt', './test/webvtt/cuetext/format/double-line-break.json')
	})

	it('line-breaks.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/format/line-breaks.vtt', './test/webvtt/cuetext/format/line-breaks.json')
	})

	it('long-line.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/format/long-line.vtt', './test/webvtt/cuetext/format/long-line.json')
	})

	it('no-line-break.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/format/no-line-break.vtt', './test/webvtt/cuetext/format/no-line-break.json')
	})

	it('no-newline-at-end.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/format/no-newline-at-end.vtt', './test/webvtt/cuetext/format/no-newline-at-end.json')
	})

})
