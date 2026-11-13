import {
	assert,
	describe,
	it,
	IsoBoxWriteView,
	type IsoInt64,
	type TrackFragmentBaseMediaDecodeTimeBox,
} from './util/box.ts'
import { boxBytes } from './util/wideBoxes.ts'

// #region example
// A tfdt writer that takes a box with a number field or a bigint field.
const writeTfdtWide = (box: TrackFragmentBaseMediaDecodeTimeBox<IsoInt64>) => {
	const size = box.version === 1 ? 8 : 4
	const writer = new IsoBoxWriteView('tfdt', 12 + size)
	writer.writeFullBox(box.version, box.flags)
	writer.writeWideUint(box.baseMediaDecodeTime, size)
	return writer
}
// #endregion example

// 2^53 + 1. A `number` cannot hold this value.
const EXACT = BigInt('9007199254740993')
const MIN = -(BigInt(2) ** BigInt(63))
const MAX = BigInt(2) ** BigInt(63) - BigInt(1)

function body(write: (writer: IsoBoxWriteView) => void, size: number): number[] {
	const writer = new IsoBoxWriteView('test', 8 + size)
	write(writer)
	return Array.from(new Uint8Array(writer.buffer).subarray(8))
}

describe('IsoBoxWriteView.writeWideUint', function () {
	it('should write a box with a bigint field or a number field', function () {
		const exact = writeTfdtWide({ type: 'tfdt', version: 1, flags: 0, baseMediaDecodeTime: EXACT })
		const number = writeTfdtWide({ type: 'tfdt', version: 1, flags: 0, baseMediaDecodeTime: 1000 })
		const version0 = writeTfdtWide({
			type: 'tfdt',
			version: 0,
			flags: 0,
			baseMediaDecodeTime: BigInt(1000),
		})

		assert.deepStrictEqual(
			new Uint8Array(exact.buffer),
			boxBytes('tfdt', [1, 1], [0, 3], [EXACT, 8]),
		)
		assert.deepStrictEqual(
			new Uint8Array(number.buffer),
			boxBytes('tfdt', [1, 1], [0, 3], [1000, 8]),
		)
		assert.deepStrictEqual(
			new Uint8Array(version0.buffer),
			boxBytes('tfdt', [0, 1], [0, 3], [1000, 4]),
		)
	})

	it('should write a number as writeUint does', function () {
		for (const [value, size] of [
			[0, 4],
			[0xffffffff, 4],
			[0, 8],
			[2 ** 32 + 5, 8],
			[Number.MAX_SAFE_INTEGER, 8],
			[2 ** 60, 8],
		] as const) {
			assert.deepStrictEqual(
				body(writer => writer.writeWideUint(value, size), size),
				body(writer => writer.writeUint(value, size), size),
			)
		}
	})

	it('should write a bigint of 8 bytes exactly', function () {
		assert.deepStrictEqual(
			body(writer => writer.writeWideUint(EXACT, 8), 8),
			[0x00, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01],
		)
		assert.deepStrictEqual(
			body(writer => writer.writeWideUint(BigInt('0xffffffffffffffff'), 8), 8),
			[0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff],
		)
		assert.deepStrictEqual(
			body(writer => writer.writeWideUint(BigInt(0), 8), 8),
			[0, 0, 0, 0, 0, 0, 0, 0],
		)
	})

	it('should write a bigint of 4 bytes', function () {
		assert.deepStrictEqual(
			body(writer => writer.writeWideUint(BigInt(0xffffffff), 4), 4),
			[0xff, 0xff, 0xff, 0xff],
		)
		assert.deepStrictEqual(
			body(writer => writer.writeWideUint(BigInt(258), 4), 4),
			[0, 0, 1, 2],
		)
	})

	it('should move the cursor by the size of the field', function () {
		assert.deepStrictEqual(
			body(writer => {
				writer.writeWideUint(BigInt(1), 4)
				writer.writeWideUint(BigInt(2), 8)
				writer.writeWideUint(3, 4)
				writer.writeWideUint(4, 8)
			}, 24),
			[0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 4],
		)
	})

	it('should throw a RangeError for a bigint that does not fit the size', function () {
		const writer = new IsoBoxWriteView('test', 16)

		assert.throws(() => writer.writeWideUint(BigInt(2) ** BigInt(32), 4), {
			name: 'RangeError',
			message: 'writeWideUint: value must be in the range 0 to 2^32 - 1, received 4294967296',
		})
		assert.throws(() => writer.writeWideUint(BigInt(-1), 4), RangeError)
		assert.throws(() => writer.writeWideUint(BigInt(2) ** BigInt(64), 8), RangeError)
		assert.throws(() => writer.writeWideUint(BigInt(-1), 8), RangeError)

		// A failed write does not move the cursor.
		writer.writeWideUint(BigInt(7), 8)
		assert.deepStrictEqual(
			Array.from(new Uint8Array(writer.buffer).subarray(8)),
			[0, 0, 0, 0, 0, 0, 0, 7],
		)
	})
})

describe('IsoBoxWriteView.writeWideInt', function () {
	it('should write a number as writeInt does', function () {
		for (const [value, size] of [
			[-1, 4],
			[-2147483648, 4],
			[2147483647, 4],
			[-1, 8],
			[-2, 8],
			[2147483648, 8],
			[Number.MIN_SAFE_INTEGER, 8],
		] as const) {
			assert.deepStrictEqual(
				body(writer => writer.writeWideInt(value, size), size),
				body(writer => writer.writeInt(value, size), size),
			)
		}
	})

	it('should write a bigint of 8 bytes exactly', function () {
		assert.deepStrictEqual(
			body(writer => writer.writeWideInt(BigInt(-1), 8), 8),
			[0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff],
		)
		assert.deepStrictEqual(
			body(writer => writer.writeWideInt(-EXACT, 8), 8),
			[0xff, 0xdf, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff],
		)
		assert.deepStrictEqual(
			body(writer => writer.writeWideInt(MIN, 8), 8),
			[0x80, 0, 0, 0, 0, 0, 0, 0],
		)
		assert.deepStrictEqual(
			body(writer => writer.writeWideInt(MAX, 8), 8),
			[0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff],
		)
	})

	it('should write a bigint of 4 bytes', function () {
		assert.deepStrictEqual(
			body(writer => writer.writeWideInt(BigInt(-1), 4), 4),
			[0xff, 0xff, 0xff, 0xff],
		)
		assert.deepStrictEqual(
			body(writer => writer.writeWideInt(BigInt(-2147483648), 4), 4),
			[0x80, 0, 0, 0],
		)
		assert.deepStrictEqual(
			body(writer => writer.writeWideInt(BigInt(2147483647), 4), 4),
			[0x7f, 0xff, 0xff, 0xff],
		)
	})

	it('should move the cursor by the size of the field', function () {
		assert.deepStrictEqual(
			body(writer => {
				writer.writeWideInt(BigInt(-1), 4)
				writer.writeWideInt(BigInt(2), 8)
				writer.writeWideInt(-3, 4)
			}, 16),
			[0xff, 0xff, 0xff, 0xff, 0, 0, 0, 0, 0, 0, 0, 2, 0xff, 0xff, 0xff, 0xfd],
		)
	})

	it('should throw a RangeError for a bigint that does not fit the size', function () {
		const writer = new IsoBoxWriteView('test', 16)

		assert.throws(() => writer.writeWideInt(MAX + BigInt(1), 8), {
			name: 'RangeError',
			message: 'writeWideInt: value must fit in 8 bytes, received 9223372036854775808',
		})
		assert.throws(() => writer.writeWideInt(MIN - BigInt(1), 8), RangeError)
		assert.throws(() => writer.writeWideInt(BigInt(2147483648), 4), {
			name: 'RangeError',
			message: 'writeWideInt: value must fit in 4 bytes, received 2147483648',
		})
		assert.throws(() => writer.writeWideInt(BigInt(-2147483649), 4), RangeError)

		// A failed write does not move the cursor.
		writer.writeWideInt(BigInt(-1), 8)
		assert.deepStrictEqual(
			Array.from(new Uint8Array(writer.buffer).subarray(8)),
			[0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff],
		)
	})
})
