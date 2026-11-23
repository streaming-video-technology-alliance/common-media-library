import {
	assert,
	describe,
	filterBoxes,
	isIsoBoxType,
	it,
	readIsoBoxes,
	readSubs,
} from '../util/box.ts'
import { boxBytes } from '../util/wideBoxes.ts'

describe('readSubs', function () {
	it('should correctly parse the box from sample data', function () {
		const boxes = filterBoxes('subsample.m4s', 'subs', { readers: { subs: readSubs } })

		assert.strictEqual(boxes.length, 1)
		assert.strictEqual(boxes[0].type, 'subs')

		const { entries } = boxes[0]
		assert.strictEqual(entries.length, 1)

		const entry = entries[0]
		assert.strictEqual(entry.sampleDelta, 1)
		assert.strictEqual(entry.subsamples.length, 3)
		assert.strictEqual(entry.subsamples.length, 3)

		const subsample = entry.subsamples[0]
		assert.strictEqual(subsample.subsampleSize, 5)
		assert.strictEqual(subsample.subsamplePriority, 0)
		assert.strictEqual(subsample.discardable, 0)
		assert.strictEqual(subsample.codecSpecificParameters, 0)
	})

	it('should read a distinct value in each field of a version 1 box', function () {
		// The 32-bit values have the top bit set, so a signed read gives a negative number.
		const bytes = boxBytes(
			'subs',
			[1, 1],
			[0, 3],
			[1, 4],
			[0x80000001, 4],
			[1, 2],
			[0x80000002, 4],
			[3, 1],
			[4, 1],
			[0x80000005, 4],
		)
		const [box] = readIsoBoxes(bytes, { readers: { subs: readSubs } })

		assert.ok(isIsoBoxType('subs', box))
		assert.deepStrictEqual(box.entries, [
			{
				sampleDelta: 0x80000001,
				subsamples: [
					{
						subsampleSize: 0x80000002,
						subsamplePriority: 3,
						discardable: 4,
						codecSpecificParameters: 0x80000005,
					},
				],
			},
		])
	})
})
