import { assert, describe, findBox, isIsoBoxType, it, readIsoBoxes, readTrun } from '../util/box.ts'
import { trunBox } from '../util/versionBoxes.ts'

describe('readTrun', function () {
	it('should correctly parse the box from sample data', function () {
		const box = findBox('mss_moof_tfdt.mp4', 'trun', { readers: { trun: readTrun } })

		assert.strictEqual(box.samples.length, 93)
		assert.strictEqual(box.dataOffset, 856)
		assert.strictEqual(box.firstSampleFlags, undefined)

		const sample = box.samples[0]
		assert.strictEqual(sample.sampleDuration, 213334)
		assert.strictEqual(sample.sampleSize, 247)
		assert.strictEqual(sample.sampleFlags, undefined)
		assert.strictEqual(sample.sampleCompositionTimeOffset, undefined)
	})

	it('should give every sample the four keys in the same order', function () {
		const box = findBox('mss_moof_tfdt.mp4', 'trun', { readers: { trun: readTrun } })

		for (const sample of box.samples) {
			assert.deepStrictEqual(Object.keys(sample), [
				'sampleDuration',
				'sampleSize',
				'sampleFlags',
				'sampleCompositionTimeOffset',
			])
		}
	})
})

describe('readTrun versions', function () {
	const offsets = [
		[0, 0xfffffffe],
		[1, -2],
		[2, -2],
	]

	for (const [version, offset] of offsets) {
		it(`should read the composition time offset of a version ${version} box`, function () {
			const [box] = readIsoBoxes(trunBox(version), { readers: { trun: readTrun } })

			assert.ok(isIsoBoxType('trun', box))
			assert.strictEqual(box.version, version)
			assert.strictEqual(box.samples.length, 1)
			assert.strictEqual(box.samples[0].sampleCompositionTimeOffset, offset)
		})
	}
})
