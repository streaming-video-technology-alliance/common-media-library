import { assert, describe, findBox, it, readTrun } from '../util/box.ts'

describe('readTrun', function () {
	it('should correctly parse the box from sample data', function () {
		const box = findBox('mss_moof_tfdt.mp4', 'trun', { readers: { trun: readTrun } })

		assert.strictEqual(box.sampleCount, 93)
		assert.strictEqual(box.dataOffset, 856)
		assert.strictEqual(box.firstSampleFlags, undefined)

		const sample = box.samples[0]
		assert.strictEqual(sample.sampleDuration, 213334)
		assert.strictEqual(sample.sampleSize, 247)
		assert.strictEqual(sample.sampleFlags, undefined)
		assert.strictEqual(sample.sampleCompositionTimeOffset, undefined)
	})
})
