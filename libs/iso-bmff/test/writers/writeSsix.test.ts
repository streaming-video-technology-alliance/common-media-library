import { writeWith } from '../util/writeWith.ts'
import { assert, describe, it, writeSsix } from '../util/box.ts'
import { boxBytes } from '../util/wideBoxes.ts'

describe('writeSsix', function () {
	it('should write the length of each list as its count', function () {
		const bytes = writeWith(writeSsix, {
			type: 'ssix',
			version: 0,
			flags: 0,
			subsegments: [{ ranges: [{ level: 1, rangeSize: 300 }] }, { ranges: [] }],
		})

		assert.deepStrictEqual(
			bytes,
			boxBytes('ssix', [0, 1], [0, 3], [2, 4], [1, 4], [1, 1], [300, 3], [0, 4]),
		)
	})
})
