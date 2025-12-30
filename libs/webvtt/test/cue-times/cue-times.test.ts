import { describe, it } from 'node:test'
import { expectCuesEqualAll } from '../utils/expectCuesEqualAll.ts'

describe('cue-times tests', () => {
	it('fraction-digits.vtt', async () => {
		await expectCuesEqualAll('test/cue-times/fraction-digits.vtt', 'test/cue-times/fraction-digits.json')
	})

	it('fractions.vtt', async () => {
		await expectCuesEqualAll('test/cue-times/fractions.vtt', 'test/cue-times/fractions.json')
	})

	it('incorrect-delimiter.vtt', async () => {
		await expectCuesEqualAll('test/cue-times/incorrect-delimiter.vtt', 'test/cue-times/incorrect-delimiter.json')
	})

	it('left-tab.vtt', async () => {
		await expectCuesEqualAll('test/cue-times/left-tab.vtt', 'test/cue-times/with-data.json')
	})

	it('max-spot-digits.vtt', async () => {
		await expectCuesEqualAll('test/cue-times/max-spot-digits.vtt', 'test/cue-times/max-spot-digits.json')
	})

	it('max-spots-over-sixty.vtt', async () => {
		await expectCuesEqualAll('test/cue-times/max-spots-over-sixty.vtt', 'test/cue-times/max-spots-over-sixty.json')
	})

	it('max-time-spots.vtt', async () => {
		await expectCuesEqualAll('test/cue-times/max-time-spots.vtt', 'test/cue-times/max-time-spots.json')
	})

	it('min-mid-digits.vtt', async () => {
		await expectCuesEqualAll('test/cue-times/min-mid-digits.vtt', 'test/cue-times/min-mid-digits.json')
	})

	it('min-top-digits.vtt', async () => {
		await expectCuesEqualAll('test/cue-times/min-top-digits.vtt', 'test/cue-times/min-top-digits.json')
	})

	it('minimum-spots-over-sixty.vtt', async () => {
		await expectCuesEqualAll('test/cue-times/minimum-spots-over-sixty.vtt', 'test/cue-times/minimum-spots-over-sixty.json')
	})

	it('minimum-time-spots.vtt', async () => {
		await expectCuesEqualAll('test/cue-times/minimum-time-spots.vtt', 'test/cue-times/minimum-time-spots.json')
	})

	it('mismatched-time-spots.vtt', async () => {
		await expectCuesEqualAll('test/cue-times/mismatched-time-spots.vtt', 'test/cue-times/mismatched-time-spots.json')
	})

	it('missing-separator.vtt', async () => {
		await expectCuesEqualAll('test/cue-times/missing-separator.vtt', 'test/cue-times/missing-separator.json')
	})

	it('missing-spaces-between-separator.vtt', async () => {
		await expectCuesEqualAll('test/cue-times/missing-spaces-between-separator.vtt', 'test/cue-times/with-data.json')
	})

	it('separator-extra-space.vtt', async () => {
		await expectCuesEqualAll('test/cue-times/separator-extra-space.vtt', 'test/cue-times/with-data.json')
	})

	it('separator-tab.vtt', async () => {
		await expectCuesEqualAll('test/cue-times/separator-tab.vtt', 'test/cue-times/with-data.json')
	})

	it('space-left-tab-right.vtt', async () => {
		await expectCuesEqualAll('test/cue-times/space-left-tab-right.vtt', 'test/cue-times/with-data.json')
	})

	it('space-right-tab-left.vtt', async () => {
		await expectCuesEqualAll('test/cue-times/space-right-tab-left.vtt', 'test/cue-times/with-data.json')
	})

	it('spaces-tabs-on-both-sides.vtt', async () => {
		await expectCuesEqualAll('test/cue-times/spaces-tabs-on-both-sides.vtt', 'test/cue-times/with-data.json')
	})

	it('tab-right.vtt', async () => {
		await expectCuesEqualAll('test/cue-times/tab-right.vtt', 'test/cue-times/with-data.json')
	})

})
