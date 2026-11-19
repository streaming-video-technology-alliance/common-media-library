import {
	assert,
	describe,
	isIsoBoxType,
	it,
	readCo64,
	readInt64AsBigInt,
	readIsoBoxes,
} from '../util/box.ts'
import { boxBytes } from '../util/wideBoxes.ts'

describe('readCo64', function () {
	it('should read the 64-bit chunk offsets', function () {
		// #region example
		const bytes = boxBytes('co64', [0, 1], [0, 3], [2, 4], [64, 8], [2 ** 33, 8])
		const [box] = readIsoBoxes(bytes, { readers: { co64: readCo64 } })

		assert.ok(isIsoBoxType('co64', box))
		assert.deepStrictEqual(box.chunkOffset, [64, 2 ** 33])
		// #endregion example
	})

	it('should read bigint offsets with readInt64AsBigInt', function () {
		const bytes = boxBytes('co64', [0, 1], [0, 3], [1, 4], [BigInt('1152921504606846977'), 8])
		const [box] = readIsoBoxes(bytes, { readers: { co64: readCo64 }, int64: readInt64AsBigInt })

		assert.ok(isIsoBoxType('co64', box))
		assert.deepStrictEqual(box.chunkOffset, [BigInt('1152921504606846977')])
	})

	it('should throw a RangeError for an entry count above the entries in the box', function () {
		const bytes = boxBytes('co64', [0, 1], [0, 3], [2, 4], [64, 8])

		assert.throws(() => readIsoBoxes(bytes, { readers: { co64: readCo64 } }), RangeError)
	})
})
