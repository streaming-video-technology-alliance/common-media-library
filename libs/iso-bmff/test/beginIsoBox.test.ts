import {
	assert,
	beginIsoBox,
	beginIsoFullBox,
	createIsoBoxWriteCursor,
	describe,
	endIsoBox,
	it,
	writeUint32,
} from './util/box.ts'

describe('beginIsoBox, beginIsoFullBox, and endIsoBox', function () {
	it('should write a full box and its size', function () {
		// #region example
		const cursor = createIsoBoxWriteCursor()

		const start = beginIsoFullBox(cursor, 'mfhd', 0, 0)
		writeUint32(cursor, 7) // sequence_number
		endIsoBox(cursor, start)

		const bytes = cursor.bytes.subarray(0, cursor.pos)
		// #endregion example

		assert.deepStrictEqual(
			Array.from(bytes),
			[0, 0, 0, 16, 0x6d, 0x66, 0x68, 0x64, 0, 0, 0, 0, 0, 0, 0, 7],
		)
	})

	it('should write the size of a box with child boxes', function () {
		const cursor = createIsoBoxWriteCursor()

		const moov = beginIsoBox(cursor, 'moov')
		const free = beginIsoBox(cursor, 'free')
		endIsoBox(cursor, free)
		endIsoBox(cursor, moov)

		assert.strictEqual(moov, 0)
		assert.strictEqual(free, 8)
		assert.deepStrictEqual(
			Array.from(cursor.bytes.subarray(0, cursor.pos)),
			[0, 0, 0, 16, 0x6d, 0x6f, 0x6f, 0x76, 0, 0, 0, 8, 0x66, 0x72, 0x65, 0x65],
		)
	})

	it('should start a box at the position of the cursor', function () {
		const cursor = createIsoBoxWriteCursor()

		writeUint32(cursor, 0)
		const start = beginIsoBox(cursor, 'free')
		endIsoBox(cursor, start)

		assert.strictEqual(start, 4)
		assert.strictEqual(cursor.view.getUint32(4), 8)
	})

	it('should throw a RangeError for a type that is not 4 characters', function () {
		assert.throws(() => beginIsoBox(createIsoBoxWriteCursor(), 'ab'), /"ab"/)
		assert.throws(() => beginIsoFullBox(createIsoBoxWriteCursor(), 'mvhd2', 0, 0), RangeError)
	})

	it('should throw a RangeError for a type with a character above U+00FF', function () {
		// 'Ā' is U+0100.
		assert.throws(
			() => beginIsoBox(createIsoBoxWriteCursor(), 'abĀd'),
			/^RangeError: .*four-character code.* received "abĀd"$/,
		)
	})

	it('should throw a RangeError for a version above 255', function () {
		assert.throws(
			() => beginIsoFullBox(createIsoBoxWriteCursor(), 'mvhd', 256, 0),
			/^RangeError: .*writeUint8.* received 256$/,
		)
	})

	it('should throw a RangeError for flags above 24 bits', function () {
		assert.throws(
			() => beginIsoFullBox(createIsoBoxWriteCursor(), 'mvhd', 0, 0x1000000),
			/^RangeError: .*writeUint24.* received 16777216$/,
		)
	})

	it('should write a size of exactly 2^32 - 1 bytes', function () {
		const cursor = createIsoBoxWriteCursor()
		const start = beginIsoBox(cursor, 'mdat')

		cursor.pos = start + 2 ** 32 - 1
		endIsoBox(cursor, start)

		assert.strictEqual(cursor.view.getUint32(start), 2 ** 32 - 1)
	})

	it('should throw a RangeError for a box above 2^32 - 1 bytes', function () {
		const cursor = createIsoBoxWriteCursor()
		const start = beginIsoBox(cursor, 'mdat')

		cursor.pos = start + 2 ** 32

		assert.throws(() => endIsoBox(cursor, start), /mdat.*4294967296/)
	})
})
