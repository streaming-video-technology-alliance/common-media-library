import {
	assert,
	createIsoBoxReadCursor,
	describe,
	it,
	readBytes,
	readFourCc,
	readInt16,
	readInt32,
	readInt8,
	readTemplate16,
	readTemplate32,
	readTerminatedUtf8,
	readUint16,
	readUint24,
	readUint32,
	readUint64,
	readUint8,
	readUtf8,
	type IsoBoxReadCursor,
} from './util/box.ts'

function cursorOf(bytes: number[]): IsoBoxReadCursor {
	return createIsoBoxReadCursor(new Uint8Array(bytes))
}

describe('read field functions', function () {
	it('should read a full box header and a field', function () {
		// #region example
		// The body of an `mfhd` box: version, flags, and sequence_number.
		const cursor = createIsoBoxReadCursor(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 7]))

		const version = readUint8(cursor) // 0
		const flags = readUint24(cursor) // 0
		const sequenceNumber = readUint32(cursor) // 7
		// #endregion example

		assert.deepStrictEqual([version, flags, sequenceNumber], [0, 0, 7])
		assert.strictEqual(cursor.pos, 8)
	})

	it('should read unsigned integers', function () {
		const cursor = cursorOf([0xff, 0xff, 0xfe, 0x01, 0x02, 0x03, 0xff, 0xff, 0xff, 0xff])

		assert.strictEqual(readUint8(cursor), 0xff)
		assert.strictEqual(readUint16(cursor), 0xfffe)
		assert.strictEqual(readUint24(cursor), 0x010203)
		assert.strictEqual(readUint32(cursor), 0xffffffff)
		assert.strictEqual(cursor.pos, 10)
	})

	it('should read 24 bits with the high bit set', function () {
		assert.strictEqual(readUint24(cursorOf([0xff, 0xff, 0xff])), 0xffffff)
	})

	it('should read signed integers', function () {
		const cursor = cursorOf([0xff, 0xff, 0xfe, 0x80, 0x00, 0x00, 0x00])

		assert.strictEqual(readInt8(cursor), -1)
		assert.strictEqual(readInt16(cursor), -2)
		assert.strictEqual(readInt32(cursor), -2147483648)
	})

	it('should read a 64-bit unsigned integer as a bigint', function () {
		const cursor = cursorOf([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff])

		assert.strictEqual(readUint64(cursor), BigInt('0xffffffffffffffff'))
		assert.strictEqual(cursor.pos, 8)
	})

	it('should read unsigned fixed-point values', function () {
		assert.strictEqual(readTemplate16(cursorOf([0x01, 0x80])), 1.5)
		assert.strictEqual(readTemplate32(cursorOf([0x00, 0x01, 0x80, 0x00])), 1.5)
		assert.strictEqual(readTemplate32(cursorOf([0xff, 0xff, 0x00, 0x00])), 65535)
	})

	it('should read an 8.8 value with the top bit set as an unsigned value', function () {
		assert.strictEqual(readTemplate16(cursorOf([0xff, 0x80])), 255.5)
	})

	it('should read a four-character code', function () {
		const cursor = cursorOf([0x75, 0x72, 0x6c, 0x20])

		assert.strictEqual(readFourCc(cursor), 'url ')
		assert.strictEqual(cursor.pos, 4)
	})

	it('should throw a RangeError for a read past the end and keep the position', function () {
		const cursor = cursorOf([0x00, 0x00, 0x00])

		assert.throws(() => readUint32(cursor), RangeError)
		assert.strictEqual(cursor.pos, 0)
		assert.throws(() => readFourCc(cursor), RangeError)
		assert.throws(() => readUint64(cursor), RangeError)
	})

	it('should stop at the end of the cursor, not at the end of the buffer', function () {
		const cursor = { ...cursorOf([0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x02]), end: 4 }

		assert.strictEqual(readUint32(cursor), 1)
		assert.throws(() => readUint8(cursor), /Cannot read 1 bytes at position 4: the box ends at 4/)
	})

	describe('readBytes', function () {
		it('should return a view that shares memory with the input', function () {
			// #region readBytes
			const input = new Uint8Array([0x09, 0x01, 0x02, 0x03])
			const cursor = createIsoBoxReadCursor(input.subarray(1))
			const bytes = readBytes(cursor, 2)
			// #endregion readBytes

			assert.deepStrictEqual(Array.from(bytes), [0x01, 0x02])
			assert.strictEqual(bytes.buffer, input.buffer)
			assert.strictEqual(bytes.byteOffset, 1)
			assert.strictEqual(cursor.pos, 2)
		})

		it('should read no bytes for a length of 0', function () {
			const cursor = cursorOf([0x01])

			assert.strictEqual(readBytes(cursor, 0).length, 0)
			assert.strictEqual(cursor.pos, 0)
		})

		it('should throw a RangeError for a negative length', function () {
			const cursor = cursorOf([0x01, 0x02])

			assert.throws(() => readBytes(cursor, -1), RangeError)
			assert.strictEqual(cursor.pos, 0)
		})

		it('should throw a RangeError for a length past the end', function () {
			assert.throws(() => readBytes(cursorOf([0x01, 0x02]), 3), RangeError)
		})
	})

	describe('readUtf8', function () {
		it('should decode UTF-8 text', function () {
			// #region readUtf8
			const cursor = cursorOf([0xc3, 0xa9, 0x61])
			const text = readUtf8(cursor, 2) // 'é'
			// #endregion readUtf8

			assert.strictEqual(text, 'é')
			assert.strictEqual(cursor.pos, 2)
		})

		it('should read the null bytes of the length', function () {
			assert.strictEqual(readUtf8(cursorOf([0x61, 0x00, 0x62]), 3), 'a\0b')
		})

		it('should read an empty string for a length of 0', function () {
			assert.strictEqual(readUtf8(cursorOf([0x61]), 0), '')
		})

		it('should throw a RangeError for a negative length', function () {
			assert.throws(() => readUtf8(cursorOf([0x61]), -1), RangeError)
		})
	})

	describe('readTerminatedUtf8', function () {
		it('should stop at the first null byte and move past it', function () {
			// #region readTerminatedUtf8
			const cursor = cursorOf([0x61, 0x00, 0x62, 0x00])
			const first = readTerminatedUtf8(cursor) // 'a', and cursor.pos is 2
			// #endregion readTerminatedUtf8

			assert.strictEqual(first, 'a')
			assert.strictEqual(cursor.pos, 2)
			assert.strictEqual(readTerminatedUtf8(cursor), 'b')
			assert.strictEqual(cursor.pos, 4)
		})

		it('should read to the end with no null byte and no error', function () {
			const cursor = cursorOf([0xc3, 0xa9])

			assert.strictEqual(readTerminatedUtf8(cursor), 'é')
			assert.strictEqual(cursor.pos, 2)
		})

		it('should stop at the end of a cursor inside the buffer', function () {
			const cursor = { ...cursorOf([0x61, 0x62, 0x63, 0x00]), end: 2 }

			assert.strictEqual(readTerminatedUtf8(cursor), 'ab')
			assert.strictEqual(cursor.pos, 2)
		})

		it('should read an empty string at the end', function () {
			const cursor = cursorOf([])

			assert.strictEqual(readTerminatedUtf8(cursor), '')
			assert.strictEqual(cursor.pos, 0)
		})
	})
})
