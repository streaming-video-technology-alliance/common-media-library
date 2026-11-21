import { writeWith } from '../util/writeWith.ts'
import { assert, describe, it, writeCo64, writeIsoBox } from '../util/box.ts'
import { boxBytes } from '../util/wideBoxes.ts'

describe('writeCo64', function () {
	it('should write the length of chunkOffset and each 64-bit offset', function () {
		// #region example
		const bytes = writeIsoBox(
			{ type: 'co64', version: 0, flags: 0, chunkOffset: [64, 2 ** 33] },
			{ writers: { co64: writeCo64 } },
		)
		// #endregion example

		assert.deepStrictEqual(bytes, boxBytes('co64', [0, 1], [0, 3], [2, 4], [64, 8], [2 ** 33, 8]))
	})

	it('should write a bigint offset', function () {
		const bytes = writeWith(writeCo64, {
			type: 'co64',
			version: 0,
			flags: 0,
			chunkOffset: [BigInt('1152921504606846977')],
		})

		assert.deepStrictEqual(
			bytes,
			boxBytes('co64', [0, 1], [0, 3], [1, 4], [BigInt('1152921504606846977'), 8]),
		)
	})

	it('should write a bigint offset with all bits set', function () {
		const bytes = writeWith(writeCo64, {
			type: 'co64',
			version: 0,
			flags: 0,
			chunkOffset: [BigInt('18446744073709551615')],
		})

		assert.deepStrictEqual(
			bytes,
			boxBytes('co64', [0, 1], [0, 3], [1, 4], [BigInt('0xffffffffffffffff'), 8]),
		)
	})
})
