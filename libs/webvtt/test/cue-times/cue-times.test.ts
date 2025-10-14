import { describe, it } from 'node:test'
import { expectCuesEqualAll } from '../utils/expectCuesEqualAll.ts'

describe('cue-times tests', () => {
	it('fraction-digits.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-times/fraction-digits.vtt', './test/webvtt/cue-times/fraction-digits.json')
	})

	it('fractions.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-times/fractions.vtt', './test/webvtt/cue-times/fractions.json')
	})

	it('incorrect-delimiter.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-times/incorrect-delimiter.vtt', './test/webvtt/cue-times/incorrect-delimiter.json')
	})

	it('left-tab.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-times/left-tab.vtt', './test/webvtt/cue-times/with-data.json')
	})

	it('max-spot-digits.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-times/max-spot-digits.vtt', './test/webvtt/cue-times/max-spot-digits.json')
	})

	it('max-spots-over-sixty.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-times/max-spots-over-sixty.vtt', './test/webvtt/cue-times/max-spots-over-sixty.json')
	})

	it('max-time-spots.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-times/max-time-spots.vtt', './test/webvtt/cue-times/max-time-spots.json')
	})

	it('min-mid-digits.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-times/min-mid-digits.vtt', './test/webvtt/cue-times/min-mid-digits.json')
	})

	it('min-top-digits.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-times/min-top-digits.vtt', './test/webvtt/cue-times/min-top-digits.json')
	})

	it('minimum-spots-over-sixty.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-times/minimum-spots-over-sixty.vtt', './test/webvtt/cue-times/minimum-spots-over-sixty.json')
	})

	it('minimum-time-spots.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-times/minimum-time-spots.vtt', './test/webvtt/cue-times/minimum-time-spots.json')
	})

	it('mismatched-time-spots.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-times/mismatched-time-spots.vtt', './test/webvtt/cue-times/mismatched-time-spots.json')
	})

	it('missing-separator.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-times/missing-separator.vtt', './test/webvtt/cue-times/missing-separator.json')
	})

	it('missing-spaces-between-separator.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-times/missing-spaces-between-separator.vtt', './test/webvtt/cue-times/with-data.json')
	})

	it('separator-extra-space.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-times/separator-extra-space.vtt', './test/webvtt/cue-times/with-data.json')
	})

	it('separator-tab.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-times/separator-tab.vtt', './test/webvtt/cue-times/with-data.json')
	})

	it('space-left-tab-right.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-times/space-left-tab-right.vtt', './test/webvtt/cue-times/with-data.json')
	})

	it('space-right-tab-left.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-times/space-right-tab-left.vtt', './test/webvtt/cue-times/with-data.json')
	})

	it('spaces-tabs-on-both-sides.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-times/spaces-tabs-on-both-sides.vtt', './test/webvtt/cue-times/with-data.json')
	})

	it('tab-right.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cue-times/tab-right.vtt', './test/webvtt/cue-times/with-data.json')
	})

})
