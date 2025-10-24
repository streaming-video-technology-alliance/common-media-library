import { describe, it } from 'node:test'
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts'

describe('cuetext/timestamp tests', () => {

	it('basic.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/timestamp/basic.vtt', './test/webvtt/cuetext/timestamp/basic.json')
	})

	it('nested.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/timestamp/nested.vtt', './test/webvtt/cuetext/timestamp/nested.json')
	})

	it('no-end-gt.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/timestamp/no-end-gt.vtt', './test/webvtt/cuetext/timestamp/no-end-gt.json')
	})

	it('non-digit.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/timestamp/non-digit.vtt', './test/webvtt/cuetext/timestamp/non-digit.json')
	})

	it('out-of-cue-range.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/timestamp/out-of-cue-range.vtt', './test/webvtt/cuetext/timestamp/out-of-cue-range.json')
	})

	it('space-after-lt.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/timestamp/space-after-lt.vtt', './test/webvtt/cuetext/timestamp/space-after-lt.json')
	})

	it('space-before-gt.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/timestamp/space-before-gt.vtt', './test/webvtt/cuetext/timestamp/space-before-gt.json')
	})
})
