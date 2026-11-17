import {
	assert,
	createInt64OverflowReader,
	describe,
	findIsoBox,
	it,
	IsoBoxReadView,
	readIsoBoxes,
	readTfdt,
} from './util/box.ts'
import { boxBytes } from './util/wideBoxes.ts'

// A version 1 tfdt box. baseMediaDecodeTime is 2^53 + 1, which a number cannot hold.
const TFDT_V1 = boxBytes('tfdt', [1, 1], [0, 3], [BigInt('9007199254740993'), 8])
const MESSAGE = '64-bit value is outside the safe integer range'
const MAX = BigInt(Number.MAX_SAFE_INTEGER)

function read(value: number | bigint, size: 4 | 8, signed: boolean): [number, RangeError[]] {
	const errors: RangeError[] = []
	const view = new IsoBoxReadView(boxBytes('test', [value, size]))

	view.jump(8)

	const result = createInt64OverflowReader(error => void errors.push(error))(view, size, signed)

	assert.strictEqual(view.bytesRemaining, 0)

	return [result, errors]
}

describe('createInt64OverflowReader', function () {
	it('should report a value that a number cannot hold', function () {
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
		const errors: RangeError[] = []
		const boxes = readIsoBoxes(bytes, {
			int64: createInt64OverflowReader(error => {
				errors.push(error)
			}),
			readers: { tfdt: readTfdt },
		})

		// The field is a number, rounded to 2^53, and errors holds one RangeError.
		const tfdt = findIsoBox(boxes, box => box.type === 'tfdt')
		// #endregion example

		assert.ok(tfdt)
		assert.strictEqual(tfdt.baseMediaDecodeTime, 2 ** 53)
		assert.strictEqual(errors.length, 1)
		assert.strictEqual(errors[0].message, '64-bit value is outside the safe integer range')

		assert.ok(errors[0] instanceof RangeError)
	})

	it('should not report the largest safe unsigned value', function () {
		assert.deepStrictEqual(read(MAX, 8, false), [Number.MAX_SAFE_INTEGER, []])
	})

	it('should report the first unsigned value outside the safe range', function () {
		const [value, errors] = read(MAX + BigInt(1), 8, false)

		assert.strictEqual(value, 2 ** 53)
		assert.strictEqual(errors.length, 1)
		assert.strictEqual(errors[0].message, MESSAGE)
	})

	it('should report the largest unsigned value', function () {
		const [value, errors] = read(BigInt('0xffffffffffffffff'), 8, false)

		assert.strictEqual(value, 2 ** 64)
		assert.strictEqual(errors.length, 1)
	})

	it('should not report the safe signed values at the limits', function () {
		assert.deepStrictEqual(read(MAX, 8, true), [Number.MAX_SAFE_INTEGER, []])
		assert.deepStrictEqual(read(-MAX, 8, true), [Number.MIN_SAFE_INTEGER, []])
		assert.deepStrictEqual(read(BigInt(-1), 8, true), [-1, []])
	})

	it('should report the first signed values outside the safe range', function () {
		const [above, aboveErrors] = read(MAX + BigInt(1), 8, true)
		const [below, belowErrors] = read(-MAX - BigInt(1), 8, true)

		assert.strictEqual(above, 2 ** 53)
		assert.strictEqual(below, -(2 ** 53))
		assert.strictEqual(aboveErrors.length, 1)
		assert.strictEqual(belowErrors.length, 1)
		assert.strictEqual(belowErrors[0].message, MESSAGE)
	})

	it('should report the smallest signed value', function () {
		const [value, errors] = read(-(BigInt(2) ** BigInt(63)), 8, true)

		assert.strictEqual(value, -(2 ** 63))
		assert.strictEqual(errors.length, 1)
	})

	it('should never report a 4-byte field', function () {
		assert.deepStrictEqual(read(0xffffffff, 4, false), [4294967295, []])
		assert.deepStrictEqual(read(-2147483648, 4, true), [-2147483648, []])
		assert.deepStrictEqual(read(-1, 4, true), [-1, []])
	})

	it('should continue the read when the callback returns', function () {
		const errors: RangeError[] = []
		const boxes = readIsoBoxes(new Uint8Array([...TFDT_V1, ...TFDT_V1]), {
			int64: createInt64OverflowReader(error => void errors.push(error)),
			readers: { tfdt: readTfdt },
		})

		assert.strictEqual(boxes.length, 2)
		assert.strictEqual(errors.length, 2)
		assert.notStrictEqual(errors[0], errors[1])
	})

	it('should stop the read with the error that the callback throws', function () {
		const failure = new Error('stop')
		let calls = 0

		assert.throws(
			() =>
				readIsoBoxes(new Uint8Array([...TFDT_V1, ...TFDT_V1]), {
					int64: createInt64OverflowReader(() => {
						calls++
						throw failure
					}),
					readers: { tfdt: readTfdt },
				}),
			(error: unknown) => error === failure,
		)
		assert.strictEqual(calls, 1)
	})
})
