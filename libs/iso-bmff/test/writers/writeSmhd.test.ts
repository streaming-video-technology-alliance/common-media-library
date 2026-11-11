import { assert, describe, it, writeSmhd } from '../util/box.ts'

// The stored integer of the balance of an smhd box.
function storedBalance(buffer: ArrayBufferLike): number {
	return new DataView(buffer).getInt16(12)
}

describe('writeSmhd', function () {
	it('should write a balance of full right', function () {
		// #region example
		const writer = writeSmhd({
			type: 'smhd',
			version: 0,
			flags: 0,
			balance: 1,
			reserved: 0,
		})
		// #endregion example

		assert.strictEqual(writer.byteLength, 16)
		assert.strictEqual(storedBalance(writer.buffer), 0x0100)
	})

	it('should write a negative balance', function () {
		const full = writeSmhd({ type: 'smhd', version: 0, flags: 0, balance: -1, reserved: 0 })
		const half = writeSmhd({ type: 'smhd', version: 0, flags: 0, balance: -0.5, reserved: 0 })

		assert.strictEqual(storedBalance(full.buffer), -0x0100)
		assert.strictEqual(storedBalance(half.buffer), -0x0080)
	})

	it('should write a balance of 0', function () {
		const writer = writeSmhd({ type: 'smhd', version: 0, flags: 0, balance: 0, reserved: 0 })

		assert.strictEqual(storedBalance(writer.buffer), 0)
	})
})
