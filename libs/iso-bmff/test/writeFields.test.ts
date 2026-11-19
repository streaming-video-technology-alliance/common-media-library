import {
	assert,
	createIsoBoxWriteCursor,
	describe,
	it,
	writeBytes,
	writeFourCc,
	writeInt16,
	writeInt32,
	writeInt8,
	writeTemplate16,
	writeTemplate32,
	writeTerminatedUtf8,
	writeUint16,
	writeUint24,
	writeUint32,
	writeUint64,
	writeUint8,
	writeUtf8,
	writeWideInt,
	writeWideUint,
} from './util/box.ts'
import { written } from './util/written.ts'

describe('write field functions', function () {
	it('should write fields at the position and move the position', function () {
		// #region example
		const cursor = createIsoBoxWriteCursor()

		writeUint8(cursor, 1) // version
		writeUint24(cursor, 0x000201) // flags
		writeUint32(cursor, 7)

		const bytes = cursor.bytes.subarray(0, cursor.pos) // 01 00 02 01 00 00 00 07
		// #endregion example

		assert.deepStrictEqual(Array.from(bytes), [1, 0, 2, 1, 0, 0, 0, 7])
	})

	it('should write unsigned integers', function () {
		const cursor = createIsoBoxWriteCursor()

		writeUint8(cursor, 0xff)
		writeUint16(cursor, 0xfffe)
		writeUint24(cursor, 0xffffff)
		writeUint32(cursor, 0xffffffff)

		assert.deepStrictEqual(
			written(cursor),
			[0xff, 0xff, 0xfe, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff],
		)
	})

	it('should write signed integers', function () {
		const cursor = createIsoBoxWriteCursor()

		writeInt8(cursor, -1)
		writeInt16(cursor, -2)
		writeInt32(cursor, -2147483648)

		assert.deepStrictEqual(written(cursor), [0xff, 0xff, 0xfe, 0x80, 0x00, 0x00, 0x00])
	})

	it('should write a 64-bit unsigned integer from a bigint', function () {
		const cursor = createIsoBoxWriteCursor()

		writeUint64(cursor, BigInt('0xffffffffffffffff'))

		assert.deepStrictEqual(written(cursor), new Array<number>(8).fill(0xff))
	})

	it('should throw a RangeError for a bigint outside 64 bits', function () {
		const cursor = createIsoBoxWriteCursor()

		assert.throws(() => writeUint64(cursor, BigInt(-1)), RangeError)
		assert.throws(() => writeUint64(cursor, BigInt('0x10000000000000000')), RangeError)
	})

	it('should write unsigned fixed-point values', function () {
		const cursor = createIsoBoxWriteCursor()

		writeTemplate16(cursor, 1.5)
		writeTemplate32(cursor, 1.5)

		assert.deepStrictEqual(written(cursor), [0x01, 0x80, 0x00, 0x01, 0x80, 0x00])
	})

	it('should write a negative fixed-point value as a two complement number', function () {
		const cursor = createIsoBoxWriteCursor()

		writeTemplate32(cursor, -1)

		assert.deepStrictEqual(written(cursor), [0xff, 0xff, 0x00, 0x00])
	})

	describe('writeWideUint and writeWideInt', function () {
		it('should write a number of 4 or 8 bytes', function () {
			const cursor = createIsoBoxWriteCursor()

			writeWideUint(cursor, 1, 4)
			writeWideUint(cursor, 2 ** 32 + 1, 8)

			assert.deepStrictEqual(written(cursor), [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1])
		})

		it('should write all bits set for a number of 2^64 or more in 8 bytes', function () {
			const cursor = createIsoBoxWriteCursor()

			writeWideUint(cursor, 2 ** 64, 8)

			assert.deepStrictEqual(written(cursor), new Array<number>(8).fill(0xff))
		})

		it('should write a bigint with the exact value', function () {
			const cursor = createIsoBoxWriteCursor()

			writeWideUint(cursor, BigInt('9007199254740993'), 8)

			assert.deepStrictEqual(written(cursor), [0, 0x20, 0, 0, 0, 0, 0, 1])
		})

		it('should throw a RangeError for a bigint that does not fit 4 bytes', function () {
			assert.throws(
				() => writeWideUint(createIsoBoxWriteCursor(), BigInt('0x100000000'), 4),
				/received 4294967296/,
			)
		})

		it('should write a negative number and a negative bigint', function () {
			const cursor = createIsoBoxWriteCursor()

			writeWideInt(cursor, -1, 8)
			writeWideInt(cursor, BigInt(-2), 8)
			writeWideInt(cursor, -3, 4)

			assert.deepStrictEqual(written(cursor), [
				...new Array<number>(8).fill(0xff),
				...new Array<number>(7).fill(0xff),
				0xfe,
				0xff,
				0xff,
				0xff,
				0xfd,
			])
		})

		it('should throw a RangeError for a bigint that does not fit a signed field', function () {
			assert.throws(
				() => writeWideInt(createIsoBoxWriteCursor(), BigInt('0x80000000'), 4),
				RangeError,
			)
		})
	})

	describe('writeFourCc', function () {
		it('should write 4 bytes', function () {
			const cursor = createIsoBoxWriteCursor()

			writeFourCc(cursor, 'url ')

			assert.deepStrictEqual(written(cursor), [0x75, 0x72, 0x6c, 0x20])
		})

		it('should throw a RangeError with the value for 3 or 5 characters', function () {
			const cursor = createIsoBoxWriteCursor()

			assert.throws(() => writeFourCc(cursor, 'mp4'), /"mp4"/)
			assert.throws(() => writeFourCc(cursor, 'mp42a'), RangeError)
			assert.strictEqual(cursor.pos, 0)
		})
	})

	describe('writeBytes', function () {
		it('should write a Uint8Array and a number array', function () {
			// #region writeBytes
			const cursor = createIsoBoxWriteCursor()

			writeBytes(cursor, new Uint8Array([1, 2]))
			writeBytes(cursor, [3, 4, 5])
			// #endregion writeBytes

			assert.deepStrictEqual(written(cursor), [1, 2, 3, 4, 5])
		})
	})

	describe('writeUtf8 and writeTerminatedUtf8', function () {
		it('should write UTF-8 text with no terminator', function () {
			const cursor = createIsoBoxWriteCursor()

			writeUtf8(cursor, 'é')

			assert.deepStrictEqual(written(cursor), [0xc3, 0xa9])
		})

		it('should write the text and one null byte', function () {
			// #region writeTerminatedUtf8
			const cursor = createIsoBoxWriteCursor()

			writeTerminatedUtf8(cursor, 'a\0b') // writes 61 00
			// #endregion writeTerminatedUtf8

			assert.deepStrictEqual(written(cursor), [0x61, 0x00])
		})

		it('should write one null byte for an empty string', function () {
			const cursor = createIsoBoxWriteCursor()

			writeTerminatedUtf8(cursor, '')

			assert.deepStrictEqual(written(cursor), [0x00])
		})
	})
})
