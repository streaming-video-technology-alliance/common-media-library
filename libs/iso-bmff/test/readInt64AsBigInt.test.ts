import {
	assert,
	describe,
	it,
	IsoBoxReadView,
	readInt64AsBigInt,
	readIsoBoxes,
	readTfdt,
} from './util/box.ts'
import { boxBytes } from './util/wideBoxes.ts'

// A version 1 tfdt box. baseMediaDecodeTime is 2^53 + 1, which a number cannot hold.
const TFDT_V1 = boxBytes('tfdt', [1, 1], [0, 3], [BigInt('9007199254740993'), 8])

describe('readInt64AsBigInt', function () {
	it('should give the built-in readers bigint fields', function () {
		// #region example
		const [box] = readIsoBoxes(TFDT_V1, {
			int64: readInt64AsBigInt,
			readers: { tfdt: readTfdt },
		})

		assert.strictEqual(box.type, 'tfdt')
		// The field is a bigint with the exact value.
		assert.strictEqual(box.baseMediaDecodeTime, BigInt('9007199254740993'))
		// #endregion example
	})

	it('should read an unsigned 8-byte field', function () {
		const view = new IsoBoxReadView(boxBytes('test', [BigInt('0xffffffffffffffff'), 8], [0, 8]))

		view.jump(8)
		assert.strictEqual(readInt64AsBigInt(view, 8, false), BigInt('18446744073709551615'))
		assert.strictEqual(view.cursor, 16)
		assert.strictEqual(readInt64AsBigInt(view, 8, false), BigInt(0))
		assert.strictEqual(view.bytesRemaining, 0)
	})

	it('should read a signed 8-byte field', function () {
		const min = -(BigInt(2) ** BigInt(63))
		const max = BigInt(2) ** BigInt(63) - BigInt(1)
		const view = new IsoBoxReadView(boxBytes('test', [BigInt(-1), 8], [min, 8], [max, 8]))

		view.jump(8)
		assert.strictEqual(readInt64AsBigInt(view, 8, true), BigInt(-1))
		assert.strictEqual(readInt64AsBigInt(view, 8, true), min)
		assert.strictEqual(readInt64AsBigInt(view, 8, true), max)
		assert.strictEqual(view.bytesRemaining, 0)
	})

	it('should read an unsigned 4-byte field', function () {
		const view = new IsoBoxReadView(boxBytes('test', [0xffffffff, 4], [7, 4]))

		view.jump(8)
		assert.strictEqual(readInt64AsBigInt(view, 4, false), BigInt(4294967295))
		assert.strictEqual(view.cursor, 12)
		assert.strictEqual(readInt64AsBigInt(view, 4, false), BigInt(7))
	})

	it('should read a signed 4-byte field', function () {
		const view = new IsoBoxReadView(boxBytes('test', [-1, 4], [-2147483648, 4], [2147483647, 4]))

		view.jump(8)
		assert.strictEqual(readInt64AsBigInt(view, 4, true), BigInt(-1))
		assert.strictEqual(readInt64AsBigInt(view, 4, true), BigInt(-2147483648))
		assert.strictEqual(readInt64AsBigInt(view, 4, true), BigInt(2147483647))
	})

	it('should throw on a view too short for the field', function () {
		const view = new IsoBoxReadView(boxBytes('test', [1, 4]))

		view.jump(8)
		assert.throws(() => readInt64AsBigInt(view, 8, false), RangeError)
	})
})
