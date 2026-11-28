import { writeWith } from '../util/writeWith.ts'
import { assert, describe, it, writeStss, writeStts } from '../util/box.ts'
import { boxBytes } from '../util/wideBoxes.ts'

describe('writeStts', function () {
	it('should write the length of entries as the entry count', function () {
		const bytes = writeWith(writeStts, {
			type: 'stts',
			version: 0,
			flags: 0,
			entries: [
				{ sampleCount: 2, sampleDelta: 1000 },
				{ sampleCount: 1, sampleDelta: 500 },
			],
		})

		assert.deepStrictEqual(
			bytes,
			boxBytes('stts', [0, 1], [0, 3], [2, 4], [2, 4], [1000, 4], [1, 4], [500, 4]),
		)
	})
})

describe('writeStss', function () {
	it('should write the length of sampleNumber as the entry count', function () {
		const bytes = writeWith(writeStss, {
			type: 'stss',
			version: 0,
			flags: 0,
			sampleNumber: [1, 31],
		})

		assert.deepStrictEqual(bytes, boxBytes('stss', [0, 1], [0, 3], [2, 4], [1, 4], [31, 4]))
	})
})
