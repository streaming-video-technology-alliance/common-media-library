import {
	assert,
	createIsoBoxReadCursor,
	describe,
	findIsoBox,
	isIsoBoxType,
	it,
	readInt64AsBigInt,
	readIsoBoxes,
	readTfdt,
} from './util/box.ts'
import { boxBytes } from './util/wideBoxes.ts'

describe('readInt64AsBigInt', function () {
	it('should give the built-in readers bigint fields', function () {
		// #region example
		// A moof box that holds a traf box with a version 1 tfdt box.
		// baseMediaDecodeTime is 2^53 + 1, which a number cannot hold.
		const bytes = new Uint8Array([
			0,
			0,
			0,
			36,
			0x6d,
			0x6f,
			0x6f,
			0x66, // moof
			0,
			0,
			0,
			28,
			0x74,
			0x72,
			0x61,
			0x66, // traf
			0,
			0,
			0,
			20,
			0x74,
			0x66,
			0x64,
			0x74,
			1,
			0,
			0,
			0, // tfdt, version 1
			0,
			0x20,
			0,
			0,
			0,
			0,
			0,
			1, // baseMediaDecodeTime
		])
		const boxes = readIsoBoxes(bytes, {
			int64: readInt64AsBigInt,
			readers: { tfdt: readTfdt },
		})

		// The field is a bigint with the exact value.
		const tfdt = findIsoBox(boxes, box => isIsoBoxType('tfdt', box))
		// #endregion example

		assert.ok(tfdt)
		assert.strictEqual(tfdt.baseMediaDecodeTime, BigInt('9007199254740993'))
	})

	it('should read an unsigned 8-byte field', function () {
		const cursor = createIsoBoxReadCursor(
			boxBytes('test', [BigInt('0xffffffffffffffff'), 8], [0, 8]),
		)

		cursor.pos = 8
		assert.strictEqual(readInt64AsBigInt(cursor, 8, false), BigInt('18446744073709551615'))
		assert.strictEqual(cursor.pos, 16)
		assert.strictEqual(readInt64AsBigInt(cursor, 8, false), BigInt(0))
		assert.strictEqual(cursor.end - cursor.pos, 0)
	})

	it('should read a signed 8-byte field', function () {
		const min = -(BigInt(2) ** BigInt(63))
		const max = BigInt(2) ** BigInt(63) - BigInt(1)
		const cursor = createIsoBoxReadCursor(boxBytes('test', [BigInt(-1), 8], [min, 8], [max, 8]))

		cursor.pos = 8
		assert.strictEqual(readInt64AsBigInt(cursor, 8, true), BigInt(-1))
		assert.strictEqual(readInt64AsBigInt(cursor, 8, true), min)
		assert.strictEqual(readInt64AsBigInt(cursor, 8, true), max)
		assert.strictEqual(cursor.end - cursor.pos, 0)
	})

	it('should read an unsigned 4-byte field', function () {
		const cursor = createIsoBoxReadCursor(boxBytes('test', [0xffffffff, 4], [7, 4]))

		cursor.pos = 8
		assert.strictEqual(readInt64AsBigInt(cursor, 4, false), BigInt(4294967295))
		assert.strictEqual(cursor.pos, 12)
		assert.strictEqual(readInt64AsBigInt(cursor, 4, false), BigInt(7))
	})

	it('should read a signed 4-byte field', function () {
		const cursor = createIsoBoxReadCursor(
			boxBytes('test', [-1, 4], [-2147483648, 4], [2147483647, 4]),
		)

		cursor.pos = 8
		assert.strictEqual(readInt64AsBigInt(cursor, 4, true), BigInt(-1))
		assert.strictEqual(readInt64AsBigInt(cursor, 4, true), BigInt(-2147483648))
		assert.strictEqual(readInt64AsBigInt(cursor, 4, true), BigInt(2147483647))
	})

	it('should throw on a cursor too short for the field', function () {
		const cursor = createIsoBoxReadCursor(boxBytes('test', [1, 4]))

		cursor.pos = 8
		assert.throws(() => readInt64AsBigInt(cursor, 8, false), RangeError)
	})
})
