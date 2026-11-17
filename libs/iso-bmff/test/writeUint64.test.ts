import { assert, describe, it, IsoBoxWriteView } from './util/box.ts'

describe('IsoBoxWriteView.writeUint64', function () {
	it('should write a 64-bit value above 2^53 exactly', function () {
		// #region example
		const writer = new IsoBoxWriteView('tfdt', 20)
		writer.writeFullBox(1, 0)
		writer.writeUint64(BigInt('9007199254740993'))
		// #endregion example

		const bytes = new Uint8Array(writer.buffer)
		assert.deepStrictEqual(
			Array.from(bytes.subarray(12)),
			[0x00, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01],
		)
	})

	it('should write the maximum value', function () {
		const writer = new IsoBoxWriteView('test', 16)
		writer.writeUint64(BigInt('0xffffffffffffffff'))

		const bytes = new Uint8Array(writer.buffer)
		assert.deepStrictEqual(
			Array.from(bytes.subarray(8)),
			[0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff],
		)
	})

	it('should throw on a value outside 0 to 2^64 - 1', function () {
		const writer = new IsoBoxWriteView('test', 16)

		assert.throws(() => writer.writeUint64(BigInt(-1)), RangeError)
		assert.throws(() => writer.writeUint64(BigInt('0x10000000000000000')), RangeError)
	})

	it('should be a compile error to call a method that is detached from the writer', function () {
		const writer = new IsoBoxWriteView('test', 24)
		/* oxlint-disable typescript/unbound-method */
		const { writeUint64, writeWideUint, writeWideInt } = writer
		/* oxlint-enable typescript/unbound-method */

		// @ts-expect-error the method needs the writer as `this`
		assert.throws(() => writeUint64(BigInt(1)), TypeError)
		// @ts-expect-error the method needs the writer as `this`
		assert.throws(() => writeWideUint(1, 4), TypeError)
		// @ts-expect-error the method needs the writer as `this`
		assert.throws(() => writeWideInt(1, 4), TypeError)
	})
})
