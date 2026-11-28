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
	type IsoBoxWriteCursor,
} from './util/box.ts'
import { written } from './util/written.ts'

// Each line: the function, its range, and the bytes of the two ends of the range.
const INTEGERS: [
	name: string,
	write: (cursor: IsoBoxWriteCursor, value: number) => void,
	min: number,
	max: number,
	minBytes: number[],
	maxBytes: number[],
][] = [
	['writeUint8', writeUint8, 0, 255, [0x00], [0xff]],
	['writeUint16', writeUint16, 0, 65535, [0x00, 0x00], [0xff, 0xff]],
	['writeUint24', writeUint24, 0, 16777215, [0x00, 0x00, 0x00], [0xff, 0xff, 0xff]],
	['writeUint32', writeUint32, 0, 4294967295, [0x00, 0x00, 0x00, 0x00], [0xff, 0xff, 0xff, 0xff]],
	['writeInt8', writeInt8, -128, 127, [0x80], [0x7f]],
	['writeInt16', writeInt16, -32768, 32767, [0x80, 0x00], [0x7f, 0xff]],
	[
		'writeInt32',
		writeInt32,
		-2147483648,
		2147483647,
		[0x80, 0x00, 0x00, 0x00],
		[0x7f, 0xff, 0xff, 0xff],
	],
]

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

	describe('integer ranges', function () {
		for (const [name, write, min, max, minBytes, maxBytes] of INTEGERS) {
			const outside: [label: string, value: unknown][] = [
				[`${min - 1}`, min - 1],
				[`${max + 1}`, max + 1],
				['1.5', 1.5],
				['NaN', NaN],
				["the string '1'", '1'],
				['undefined', undefined],
				['the bigint 1', BigInt(1)],
			]

			it(`should write the two ends of the range of ${name}`, function () {
				const cursor = createIsoBoxWriteCursor()

				write(cursor, min)
				write(cursor, max)

				assert.deepStrictEqual(written(cursor), [...minBytes, ...maxBytes])
			})

			for (const [label, value] of outside) {
				it(`should throw a RangeError for ${label} in ${name} and keep the position`, function () {
					const cursor = createIsoBoxWriteCursor()

					write(cursor, max)

					assert.throws(
						() => write(cursor, value as number),
						(error: unknown) =>
							error instanceof RangeError &&
							error.message.includes(name) &&
							error.message.endsWith(` received ${String(value)}`),
					)
					assert.deepStrictEqual(written(cursor), maxBytes)
				})
			}
		}
	})

	it('should throw a RangeError for bytes with a length that is not an integer', function () {
		const cursor = createIsoBoxWriteCursor()

		assert.throws(
			() => writeBytes(cursor, { length: 1.5, 0: 1, 1: 2 }),
			(error: unknown) => error instanceof RangeError && error.message.includes('writeBytes'),
		)
		assert.strictEqual(cursor.pos, 0)
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

	it('should throw a RangeError for a value of writeUint64 that is not a bigint', function () {
		const cursor = createIsoBoxWriteCursor()

		assert.throws(() => writeUint64(cursor, 5 as never), /^RangeError: .*writeUint64.* received 5$/)
		assert.strictEqual(cursor.pos, 0)
	})

	describe('writeTemplate16 and writeTemplate32', function () {
		it('should write unsigned fixed-point values', function () {
			const cursor = createIsoBoxWriteCursor()

			writeTemplate16(cursor, 1.5)
			writeTemplate32(cursor, 1.5)

			assert.deepStrictEqual(written(cursor), [0x01, 0x80, 0x00, 0x01, 0x80, 0x00])
		})

		it('should write the largest values of the two fields', function () {
			const cursor = createIsoBoxWriteCursor()

			// 0xffff / 0x100 and 0xffffffff / 0x10000
			writeTemplate16(cursor, 255.99609375)
			writeTemplate32(cursor, 65535.9999847412109375)

			assert.deepStrictEqual(written(cursor), [0xff, 0xff, 0xff, 0xff, 0xff, 0xff])
		})

		it('should round to the nearest value of the field', function () {
			const cursor = createIsoBoxWriteCursor()

			// 1.002 * 0x100 is 256.512, and 1.00001 * 0x10000 is 65536.65536.
			writeTemplate16(cursor, 1.002)
			writeTemplate32(cursor, 1.00001)

			assert.deepStrictEqual(written(cursor), [0x01, 0x01, 0x00, 0x01, 0x00, 0x01])
		})

		it('should throw a RangeError for a negative value and keep the position', function () {
			const cursor = createIsoBoxWriteCursor()

			// The error has the value in units of the field: -1 * 0x100 and -1 * 0x10000.
			assert.throws(
				() => writeTemplate16(cursor, -1),
				/^RangeError: .*writeUint16.* received -256$/,
			)
			assert.throws(
				() => writeTemplate32(cursor, -1),
				/^RangeError: .*writeUint32.* received -65536$/,
			)
			assert.strictEqual(cursor.pos, 0)
		})

		it('should throw a RangeError for the first value above each field', function () {
			const cursor = createIsoBoxWriteCursor()

			assert.throws(
				() => writeTemplate16(cursor, 256),
				/^RangeError: .*writeUint16.* received 65536$/,
			)
			assert.throws(
				() => writeTemplate32(cursor, 65536),
				/^RangeError: .*writeUint32.* received 4294967296$/,
			)
			assert.strictEqual(cursor.pos, 0)
		})

		it('should throw a RangeError for a value that rounds to a value above the field', function () {
			const cursor = createIsoBoxWriteCursor()

			// 255.999 * 0x100 is 65535.744, and 65535.999995 * 0x10000 is 4294967295.67232.
			assert.throws(
				() => writeTemplate16(cursor, 255.999),
				/^RangeError: .*writeUint16.* received 65536$/,
			)
			assert.throws(
				() => writeTemplate32(cursor, 65535.999995),
				/^RangeError: .*writeUint32.* received 4294967296$/,
			)
			assert.strictEqual(cursor.pos, 0)
		})

		it('should throw a RangeError for NaN', function () {
			const cursor = createIsoBoxWriteCursor()

			assert.throws(
				() => writeTemplate16(cursor, NaN),
				/^RangeError: .*writeUint16.* received NaN$/,
			)
			assert.throws(
				() => writeTemplate32(cursor, NaN),
				/^RangeError: .*writeUint32.* received NaN$/,
			)
			assert.strictEqual(cursor.pos, 0)
		})
	})

	describe('writeWideUint and writeWideInt', function () {
		it('should write a number of 4 or 8 bytes', function () {
			const cursor = createIsoBoxWriteCursor()

			writeWideUint(cursor, 1, 4)
			writeWideUint(cursor, 2 ** 32 + 1, 8)

			assert.deepStrictEqual(written(cursor), [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1])
		})

		it('should write all bits set for the number 2^64 in 8 bytes', function () {
			const cursor = createIsoBoxWriteCursor()

			writeWideUint(cursor, 2 ** 64, 8)

			assert.deepStrictEqual(written(cursor), new Array<number>(8).fill(0xff))
		})

		it('should write the exact bytes of the largest number below 2^64', function () {
			const cursor = createIsoBoxWriteCursor()

			// The largest number below 2^64 is 2^64 - 2048.
			writeWideUint(cursor, 2 ** 64 - 2048, 8)

			assert.deepStrictEqual(written(cursor), [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xf8, 0x00])
		})

		it('should throw a RangeError for a number above 2^64 in 8 bytes', function () {
			const cursor = createIsoBoxWriteCursor()

			// 2^65 as a string is 36893488147419103000.
			assert.throws(
				() => writeWideUint(cursor, 2 ** 65, 8),
				/^RangeError: .*writeWideUint.* received 36893488147419103000$/,
			)
			assert.strictEqual(cursor.pos, 0)
		})

		it('should throw a RangeError for a negative number in an unsigned field of 8 bytes', function () {
			const cursor = createIsoBoxWriteCursor()

			assert.throws(
				() => writeWideUint(cursor, -1, 8),
				/^RangeError: .*writeWideUint.* received -1$/,
			)
			assert.strictEqual(cursor.pos, 0)
		})

		it('should throw a RangeError for a fraction in a field of 8 bytes', function () {
			const cursor = createIsoBoxWriteCursor()

			assert.throws(
				() => writeWideUint(cursor, 1.5, 8),
				/^RangeError: .*writeWideUint.* received 1\.5$/,
			)
			assert.throws(
				() => writeWideInt(cursor, 1.5, 8),
				/^RangeError: .*writeWideInt.* received 1\.5$/,
			)
			assert.strictEqual(cursor.pos, 0)
		})

		it('should throw a RangeError for a value that is not a number or a bigint', function () {
			const cursor = createIsoBoxWriteCursor()

			assert.throws(
				() => writeWideUint(cursor, '1' as never, 8),
				/^RangeError: .*writeWideUint.* received 1$/,
			)
			assert.throws(
				() => writeWideInt(cursor, undefined as never, 8),
				/^RangeError: .*writeWideInt.* received undefined$/,
			)
			assert.strictEqual(cursor.pos, 0)
		})

		it('should use the range of writeUint32 and writeInt32 for a number in 4 bytes', function () {
			const cursor = createIsoBoxWriteCursor()

			assert.throws(
				() => writeWideUint(cursor, 2 ** 32, 4),
				/^RangeError: .*writeUint32.* received 4294967296$/,
			)
			assert.throws(
				() => writeWideInt(cursor, 2 ** 31, 4),
				/^RangeError: .*writeInt32.* received 2147483648$/,
			)
			assert.strictEqual(cursor.pos, 0)
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

		it('should write a positive number of 2^33 or more as a signed field of 8 bytes', function () {
			const cursor = createIsoBoxWriteCursor()

			// 2^40 + 7 has the high word 0x00000100 and the low word 7.
			writeWideInt(cursor, 2 ** 40 + 7, 8)

			assert.deepStrictEqual(written(cursor), [0, 0, 1, 0, 0, 0, 0, 7])
		})

		it('should write the two ends of the number range of a signed field of 8 bytes', function () {
			const cursor = createIsoBoxWriteCursor()

			// The largest number below 2^63 is 2^63 - 1024.
			writeWideInt(cursor, -(2 ** 63), 8)
			writeWideInt(cursor, 2 ** 63 - 1024, 8)

			assert.deepStrictEqual(
				written(cursor),
				[0x80, 0, 0, 0, 0, 0, 0, 0, 0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xfc, 0x00],
			)
		})

		it('should throw a RangeError for the number 2^63 in a signed field of 8 bytes', function () {
			const cursor = createIsoBoxWriteCursor()

			// 2^63 as a string is 9223372036854776000.
			assert.throws(
				() => writeWideInt(cursor, 2 ** 63, 8),
				/^RangeError: .*writeWideInt.* received 9223372036854776000$/,
			)
			assert.strictEqual(cursor.pos, 0)
		})

		it('should throw a RangeError for a number below -2^63 in a signed field of 8 bytes', function () {
			const cursor = createIsoBoxWriteCursor()

			// The largest number below -2^63 is -2^63 - 2048. As a string it is -9223372036854778000.
			assert.throws(
				() => writeWideInt(cursor, -(2 ** 63) - 2048, 8),
				/^RangeError: .*writeWideInt.* received -9223372036854778000$/,
			)
			assert.strictEqual(cursor.pos, 0)
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

		it('should write a character from U+0080 to U+00FF as one byte', function () {
			const cursor = createIsoBoxWriteCursor()

			// '©' is U+00A9.
			writeFourCc(cursor, '©too')

			assert.deepStrictEqual(written(cursor), [0xa9, 0x74, 0x6f, 0x6f])
		})

		it('should throw a RangeError with the value for 3 or 5 characters', function () {
			const cursor = createIsoBoxWriteCursor()

			assert.throws(
				() => writeFourCc(cursor, 'mp4'),
				/^RangeError: .*four-character code.* received "mp4"$/,
			)
			assert.throws(
				() => writeFourCc(cursor, 'mp42a'),
				/^RangeError: .*four-character code.* received "mp42a"$/,
			)
			assert.strictEqual(cursor.pos, 0)
		})

		it('should throw a RangeError for a character above U+00FF', function () {
			const cursor = createIsoBoxWriteCursor()

			// 'Ā' is U+0100.
			assert.throws(
				() => writeFourCc(cursor, 'aĀbc'),
				/^RangeError: .*four-character code.* received "aĀbc"$/,
			)
			assert.strictEqual(cursor.pos, 0)
		})

		it('should throw a RangeError for a value that is not a string', function () {
			const cursor = createIsoBoxWriteCursor()

			assert.throws(
				() => writeFourCc(cursor, ['a', 'b', 'c', 'd'] as never),
				/^RangeError: .*four-character code.* received "a,b,c,d"$/,
			)
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

		it('should throw a RangeError for an ArrayBuffer and for a DataView', function () {
			const cursor = createIsoBoxWriteCursor()

			assert.throws(
				() => writeBytes(cursor, new ArrayBuffer(2) as never),
				/^RangeError: .*writeBytes.* received \[object ArrayBuffer\]$/,
			)
			assert.throws(
				() => writeBytes(cursor, new DataView(new ArrayBuffer(2)) as never),
				/^RangeError: .*writeBytes.* received \[object DataView\]$/,
			)
			assert.strictEqual(cursor.pos, 0)
		})

		it('should throw a RangeError for an item above 255 of a number array', function () {
			const cursor = createIsoBoxWriteCursor()

			assert.throws(() => writeBytes(cursor, [1, 256]), /^RangeError: .*writeBytes.* received 256$/)
			assert.strictEqual(cursor.pos, 0)
		})

		it('should throw a RangeError for a negative item of a number array', function () {
			const cursor = createIsoBoxWriteCursor()

			assert.throws(() => writeBytes(cursor, [1, -1]), /^RangeError: .*writeBytes.* received -1$/)
			assert.strictEqual(cursor.pos, 0)
		})

		it('should throw a RangeError for a fraction in a number array', function () {
			const cursor = createIsoBoxWriteCursor()

			assert.throws(
				() => writeBytes(cursor, [1, 1.5]),
				/^RangeError: .*writeBytes.* received 1\.5$/,
			)
			assert.strictEqual(cursor.pos, 0)
		})

		it('should throw a RangeError for an item above 255 of a Uint16Array', function () {
			const cursor = createIsoBoxWriteCursor()

			assert.throws(
				() => writeBytes(cursor, new Uint16Array([1, 256])),
				/^RangeError: .*writeBytes.* received 256$/,
			)
			assert.strictEqual(cursor.pos, 0)
		})

		it('should throw a RangeError for a string', function () {
			const cursor = createIsoBoxWriteCursor()

			assert.throws(
				() => writeBytes(cursor, 'ab' as never),
				/^RangeError: .*writeBytes.* received a$/,
			)
			assert.strictEqual(cursor.pos, 0)
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

			writeTerminatedUtf8(cursor, 'a') // writes 61 00
			// #endregion writeTerminatedUtf8

			assert.deepStrictEqual(written(cursor), [0x61, 0x00])
		})

		it('should write one null byte for an empty string', function () {
			const cursor = createIsoBoxWriteCursor()

			writeTerminatedUtf8(cursor, '')

			assert.deepStrictEqual(written(cursor), [0x00])
		})

		it('should throw a RangeError for a terminated string with U+0000', function () {
			const cursor = createIsoBoxWriteCursor()

			assert.throws(
				() => writeTerminatedUtf8(cursor, 'a\0b'),
				(error: unknown) =>
					error instanceof RangeError &&
					error.message.includes('writeTerminatedUtf8') &&
					error.message.endsWith(' received a\0b'),
			)
			assert.strictEqual(cursor.pos, 0)
		})

		it('should throw a RangeError for a terminated value that is not a string', function () {
			const cursor = createIsoBoxWriteCursor()

			assert.throws(
				() => writeTerminatedUtf8(cursor, ['a'] as never),
				/^RangeError: .*writeTerminatedUtf8.* received a$/,
			)
			assert.strictEqual(cursor.pos, 0)
		})

		it('should throw a RangeError for a value of writeUtf8 that is not a string', function () {
			const cursor = createIsoBoxWriteCursor()

			assert.throws(() => writeUtf8(cursor, 5 as never), /^RangeError: .*writeUtf8.* received 5$/)
			assert.strictEqual(cursor.pos, 0)
		})
	})
})
