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

	it('should read an offset with all bits set as an unsigned value', function () {
		const bytes = boxBytes('co64', [0, 1], [0, 3], [1, 4], [BigInt('0xffffffffffffffff'), 8])
		const [plain] = readIsoBoxes(bytes, { readers: { co64: readCo64 } })
		const [big] = readIsoBoxes(bytes, { readers: { co64: readCo64 }, int64: readInt64AsBigInt })

		assert.ok(isIsoBoxType('co64', plain))
		assert.ok(isIsoBoxType('co64', big))
		// A number rounds 2^64 - 1 to 2^64.
		assert.deepStrictEqual(plain.chunkOffset, [2 ** 64])
		assert.deepStrictEqual(big.chunkOffset, [BigInt('18446744073709551615')])
	})

	it('should throw a RangeError for an entry count above the entries in the box', function () {
		const bytes = boxBytes('co64', [0, 1], [0, 3], [2, 4], [64, 8])

		assert.throws(() => readIsoBoxes(bytes, { readers: { co64: readCo64 } }), RangeError)
	})
})
