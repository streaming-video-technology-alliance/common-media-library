import { assert, describe, findBox, isIsoBoxType, it, readIsoBoxes, readTrun } from '../util/box.ts'
import { trunBox } from '../util/versionBoxes.ts'
import { boxBytes } from '../util/wideBoxes.ts'

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

describe('readTrun sample_count', function () {
	it('should throw a RangeError before it creates the samples when the records pass the end of the box', function () {
		// Flags 0x300: duration and size, 8 bytes for each sample. The box has one record and a count of 3.
		const bytes = boxBytes('trun', [0, 1], [0x300, 3], [3, 4], [100, 4], [200, 4])

		assert.throws(() => readIsoBoxes(bytes, { readers: { trun: readTrun } }), {
			name: 'RangeError',
			message:
				'readTrun: sample_count must be at most 1 for the 8 bytes of sample records in the box, received 3',
		})
	})

	it('should not allocate the samples of a count of 0xffffffff', function () {
		const bytes = boxBytes('trun', [0, 1], [0x100, 3], [0xffffffff, 4], [100, 4])

		assert.throws(
			() => readIsoBoxes(bytes, { readers: { trun: readTrun } }),
			/received 4294967295$/,
		)
	})

	it('should read a count with no sample record fields', function () {
		const bytes = boxBytes('trun', [0, 1], [0, 3], [5, 4])
		const [box] = readIsoBoxes(bytes, { readers: { trun: readTrun } })

		assert.ok(isIsoBoxType('trun', box))
		assert.strictEqual(box.samples.length, 5)
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
