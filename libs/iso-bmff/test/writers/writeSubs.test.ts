import { writeWith } from '../util/writeWith.ts'
import { assert, describe, it, writeSubs } from '../util/box.ts'
import { boxBytes } from '../util/wideBoxes.ts'

describe('writeSubs', function () {
	it('should write the length of each list as its count', function () {
		const bytes = writeWith(writeSubs, {
			type: 'subs',
			version: 0,
			flags: 0,
			entries: [
				{
					sampleDelta: 1,
					subsamples: [
						{ subsampleSize: 6, subsamplePriority: 0, discardable: 0, codecSpecificParameters: 0 },
					],
				},
			],
		})

		assert.deepStrictEqual(
			bytes,
			boxBytes('subs', [0, 1], [0, 3], [1, 4], [1, 4], [1, 2], [6, 2], [0, 1], [0, 1], [0, 4]),
		)
	})

	it('should write a distinct value in each field of a version 1 box', function () {
		const bytes = writeWith(writeSubs, {
			type: 'subs',
			version: 1,
			flags: 0,
			entries: [
				{
					sampleDelta: 2,
					subsamples: [
						{
							subsampleSize: 70000,
							subsamplePriority: 3,
							discardable: 4,
							codecSpecificParameters: 5,
						},
					],
				},
			],
		})

		assert.deepStrictEqual(
			bytes,
			boxBytes('subs', [1, 1], [0, 3], [1, 4], [2, 4], [1, 2], [70000, 4], [3, 1], [4, 1], [5, 4]),
		)
	})

	it('should throw a RangeError for more than 65535 subsamples in one entry', function () {
		const subsample = {
			subsampleSize: 1,
			subsamplePriority: 0,
			discardable: 0,
			codecSpecificParameters: 0,
		}

		assert.throws(
			() =>
				writeWith(writeSubs, {
					type: 'subs',
					version: 0,
					flags: 0,
					entries: [{ sampleDelta: 1, subsamples: Array.from({ length: 65536 }, () => subsample) }],
				}),
			{
				name: 'RangeError',
				message: 'The subs box has 65536 subsamples in one entry, and the limit is 65535',
			},
		)
	})
})
