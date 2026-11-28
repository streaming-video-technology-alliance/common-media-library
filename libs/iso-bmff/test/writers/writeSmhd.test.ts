import { writeWith } from '../util/writeWith.ts'
import { assert, describe, it, writeIsoBox, writeSmhd } from '../util/box.ts'

// The stored integer of the balance of an smhd box.
function storedBalance(buffer: ArrayBufferLike): number {
	return new DataView(buffer).getInt16(12)
}

describe('writeSmhd', function () {
	it('should write a balance of full right', function () {
		// #region example
		const writer = writeIsoBox(
			{
				type: 'smhd',
				version: 0,
				flags: 0,
				balance: 1,
			},
			{ writers: { smhd: writeSmhd } },
		)
		// #endregion example

		assert.strictEqual(writer.byteLength, 16)
		assert.strictEqual(storedBalance(writer.buffer), 0x0100)
	})

	it('should write a negative balance', function () {
		const full = writeWith(writeSmhd, { type: 'smhd', version: 0, flags: 0, balance: -1 })
		const half = writeWith(writeSmhd, { type: 'smhd', version: 0, flags: 0, balance: -0.5 })

		assert.strictEqual(storedBalance(full.buffer), -0x0100)
		assert.strictEqual(storedBalance(half.buffer), -0x0080)
	})

	it('should write a balance of 0', function () {
		const writer = writeWith(writeSmhd, { type: 'smhd', version: 0, flags: 0, balance: 0 })

		assert.strictEqual(storedBalance(writer.buffer), 0)
	})

	it('should write the bytes of a negative balance as a signed field', function () {
		const bytes = writeWith(writeSmhd, { type: 'smhd', version: 0, flags: 0, balance: -0.5 })

		// balance is a signed 8.8 field at the offset 12.
		assert.deepStrictEqual(Array.from(bytes.subarray(12, 14)), [0xff, 0x80])
	})

	it('should throw a RangeError for a balance above the signed 8.8 range', function () {
		// 128 in an 8.8 field is 0x8000.
		assert.throws(
			() => writeWith(writeSmhd, { type: 'smhd', version: 0, flags: 0, balance: 128 }),
			/^RangeError: .*writeInt16.* received 32768$/,
		)
	})
})
