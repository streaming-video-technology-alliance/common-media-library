import { describe, it } from 'node:test'
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts'

describe('cuetext/timestamp tests', () => {

	it('basic.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/timestamp/basic.vtt', 'test/cuetext/timestamp/basic.json')
	})

	it('nested.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/timestamp/nested.vtt', 'test/cuetext/timestamp/nested.json')
	})

	it('no-end-gt.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/timestamp/no-end-gt.vtt', 'test/cuetext/timestamp/no-end-gt.json')
	})

	it('non-digit.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/timestamp/non-digit.vtt', 'test/cuetext/timestamp/non-digit.json')
	})

	it('out-of-cue-range.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/timestamp/out-of-cue-range.vtt', 'test/cuetext/timestamp/out-of-cue-range.json')
	})

	it('space-after-lt.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/timestamp/space-after-lt.vtt', 'test/cuetext/timestamp/space-after-lt.json')
	})

	it('space-before-gt.vtt', async () => {
		await expectCuesEqualAll('test/cuetext/timestamp/space-before-gt.vtt', 'test/cuetext/timestamp/space-before-gt.json')
	})
})
