import {
	assert,
	createIsoBoxReadCursor,
	describe,
	it,
	readInt64AsBigInt,
	readIsoBoxes,
	readUint24,
	readUint8,
	readWideInt,
	readWideUint,
	type IsoBoxReadCursor,
	type IsoInt64,
} from './util/box.ts'
import { boxBytes } from './util/wideBoxes.ts'

// #region example
// A tfdt reader that follows the int64 option of the configuration.
const readTfdtWide = <V extends IsoInt64>(cursor: IsoBoxReadCursor<V>) => {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)
	const baseMediaDecodeTime = readWideUint(cursor, version === 1 ? 8 : 4)

	return { type: 'tfdt' as const, version, flags, baseMediaDecodeTime }
}
// #endregion example

// 2^53 + 1. A `number` rounds this value to 2^53.
const EXACT = BigInt('9007199254740993')
const TFDT_V1 = boxBytes('tfdt', [1, 1], [0, 3], [EXACT, 8])
const TFDT_V0 = boxBytes('tfdt', [0, 1], [0, 3], [1000, 4])

describe('readWideUint', function () {
	it('should return a number with no int64 function', function () {
		const [box] = readIsoBoxes(TFDT_V1, { readers: { tfdt: readTfdtWide } })

		assert.ok(box?.type === 'tfdt' && 'baseMediaDecodeTime' in box)
		assert.strictEqual(box.baseMediaDecodeTime, 2 ** 53)
	})

	it('should return the result of the int64 function', function () {
		const config = { int64: readInt64AsBigInt, readers: { tfdt: readTfdtWide } }
		const [box] = readIsoBoxes(TFDT_V1, config)
		const [version0] = readIsoBoxes(TFDT_V0, config)

		assert.ok(box?.type === 'tfdt' && 'baseMediaDecodeTime' in box)
		assert.ok(version0?.type === 'tfdt' && 'baseMediaDecodeTime' in version0)
		assert.strictEqual(box.baseMediaDecodeTime, EXACT)
		assert.strictEqual(version0.baseMediaDecodeTime, BigInt(1000))
	})

	it('should read 2^64 for 8 bytes with all bits set and no int64 function', function () {
		const cursor = createIsoBoxReadCursor(new Uint8Array(8).fill(0xff))

		assert.strictEqual(readWideUint(cursor, 8), 2 ** 64)
		assert.strictEqual(cursor.pos, 8)
	})

	it('should throw a RangeError past the end of the cursor and keep the position', function () {
		const cursor = createIsoBoxReadCursor(new Uint8Array(7))

		assert.throws(() => readWideUint(cursor, 8), RangeError)
		assert.throws(() => readWideInt(cursor, 8), RangeError)
		assert.strictEqual(cursor.pos, 0)
	})

	it('should throw a RangeError for a size that is not an integer and keep the position', function () {
		const cursor = createIsoBoxReadCursor(new Uint8Array(8))

		assert.throws(() => readWideUint(cursor, 2.5 as 4), {
			name: 'RangeError',
			message: 'Cannot read 2.5 bytes at position 0: the box ends at 8',
		})
		assert.strictEqual(cursor.pos, 0)
	})
})

describe('readWideInt', function () {
	it('should read -1 from 8 bytes with all bits set', function () {
		const cursor = createIsoBoxReadCursor(new Uint8Array(8).fill(0xff))

		assert.strictEqual(readWideInt(cursor, 8), -1)
	})

	it('should read a negative value of 4 bytes', function () {
		assert.strictEqual(
			readWideInt(createIsoBoxReadCursor(new Uint8Array([0xff, 0xff, 0xff, 0xfe])), 4),
			-2,
		)
	})

	it('should return a bigint with readInt64AsBigInt', function () {
		const cursor = createIsoBoxReadCursor(new Uint8Array(8).fill(0xff), {
			int64: readInt64AsBigInt,
		})

		assert.strictEqual(readWideInt(cursor, 8), BigInt(-1))
	})
})
