import { assert, createIsoBoxReadCursor, describe, it, readUint32 } from './util/box.ts'

describe('createIsoBoxReadCursor', function () {
	it('should create a cursor for a Uint8Array', function () {
		// #region example
		const cursor = createIsoBoxReadCursor(
			new Uint8Array([0x00, 0x00, 0x00, 0x08, 0x66, 0x72, 0x65, 0x65]),
		)

		const size = readUint32(cursor) // 8, and cursor.pos is 4
		// #endregion example

		assert.strictEqual(size, 8)
		assert.strictEqual(cursor.start, 0)
		assert.strictEqual(cursor.pos, 4)
		assert.strictEqual(cursor.end, 8)
	})

	it('should create a cursor for an ArrayBuffer', function () {
		const buffer = new Uint8Array([0x01, 0x02, 0x03]).buffer
		const cursor = createIsoBoxReadCursor(buffer)

		assert.strictEqual(cursor.view.buffer, buffer)
		assert.strictEqual(cursor.view.byteOffset, 0)
		assert.strictEqual(cursor.end, 3)
	})

	it('should keep the byte offset and the byte length of a view', function () {
		const bytes = new Uint8Array([0xff, 0x00, 0x00, 0x00, 0x2a, 0xff]).subarray(1, 5)
		const cursor = createIsoBoxReadCursor(bytes)

		assert.strictEqual(cursor.view.byteOffset, 1)
		assert.strictEqual(cursor.view.byteLength, 4)
		assert.strictEqual(cursor.pos, 0)
		assert.strictEqual(cursor.end, 4)
		assert.strictEqual(readUint32(cursor), 42)
	})
})
