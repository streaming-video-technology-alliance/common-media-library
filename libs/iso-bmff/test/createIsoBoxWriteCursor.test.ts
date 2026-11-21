import {
	assert,
	createIsoBoxWriteCursor,
	describe,
	it,
	writeBytes,
	writeUint32,
} from './util/box.ts'

describe('createIsoBoxWriteCursor', function () {
	it('should create a cursor with a first buffer of the capacity', function () {
		// #region example
		const cursor = createIsoBoxWriteCursor({ capacity: 64 })

		writeUint32(cursor, 7)

		const bytes = cursor.bytes.subarray(0, cursor.pos) // 00 00 00 07
		// #endregion example

		assert.strictEqual(cursor.bytes.length, 64)
		assert.deepStrictEqual(Array.from(bytes), [0, 0, 0, 7])
	})

	it('should create a cursor with a buffer of 1024 bytes by default', function () {
		const cursor = createIsoBoxWriteCursor()

		assert.strictEqual(cursor.pos, 0)
		assert.strictEqual(cursor.bytes.length, 1024)
		assert.strictEqual(cursor.view.buffer, cursor.bytes.buffer)
	})

	it('should grow from a capacity of 0', function () {
		const cursor = createIsoBoxWriteCursor({ capacity: 0 })

		writeUint32(cursor, 7)

		assert.ok(cursor.bytes.length >= 4)
		assert.strictEqual(cursor.pos, 4)
		assert.deepStrictEqual(Array.from(cursor.bytes.subarray(0, 4)), [0, 0, 0, 7])
	})

	it('should grow from a capacity of 1', function () {
		const cursor = createIsoBoxWriteCursor({ capacity: 1 })

		writeUint32(cursor, 7)

		assert.strictEqual(cursor.pos, 4)
		assert.deepStrictEqual(Array.from(cursor.bytes.subarray(0, 4)), [0, 0, 0, 7])
	})

	it('should keep the written bytes when the buffer grows', function () {
		const cursor = createIsoBoxWriteCursor({ capacity: 4 })
		const first = cursor.bytes

		writeUint32(cursor, 1)
		writeUint32(cursor, 2)

		assert.notStrictEqual(cursor.bytes, first)
		assert.strictEqual(cursor.view.buffer, cursor.bytes.buffer)
		assert.deepStrictEqual(Array.from(cursor.bytes.subarray(0, 8)), [0, 0, 0, 1, 0, 0, 0, 2])
	})

	it('should grow to the size of a large write', function () {
		const cursor = createIsoBoxWriteCursor({ capacity: 2 })

		writeBytes(cursor, new Uint8Array(100).fill(9))

		assert.strictEqual(cursor.pos, 100)
		assert.ok(cursor.bytes.length >= 100)
		assert.strictEqual(cursor.bytes[99], 9)
	})
})
