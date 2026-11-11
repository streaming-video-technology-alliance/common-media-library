import { assert, describe, it, IsoBoxReadView } from './util/box.ts'

const MAIN = [0x6d, 0x61, 0x69, 0x6e] // 'main'
const NEXT = [0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x11, 0x22] // the bytes after the view

describe('IsoBoxReadView.readData', function () {
	it('should read the number of bytes of a positive size', function () {
		// #region example
		const view = new IsoBoxReadView(new Uint8Array([0x6d, 0x61, 0x69, 0x6e]))

		const first = view.readData(1) // one byte, the view moves one byte
		const rest = view.readData(-1) // the three bytes that remain
		// #endregion example

		assert.deepStrictEqual(Array.from(first), [0x6d])
		assert.deepStrictEqual(Array.from(rest), [0x61, 0x69, 0x6e])
		assert.strictEqual(view.cursor, 4)
		assert.strictEqual(view.bytesRemaining, 0)
	})

	it('should read no bytes when the size is 0', function () {
		const view = new IsoBoxReadView(new Uint8Array(MAIN))

		assert.deepStrictEqual(Array.from(view.readData(0)), [])
		assert.strictEqual(view.cursor, 0)
		assert.deepStrictEqual(Array.from(view.readData(4)), MAIN)
	})

	it('should stop at the end of a view inside a buffer when a positive size exceeds the bytes that remain', function () {
		const buffer = new Uint8Array([0x01, 0x02, ...MAIN, ...NEXT])
		const view = new IsoBoxReadView(buffer.subarray(2, 6))

		view.jump(2)

		assert.deepStrictEqual(Array.from(view.readData(8)), [0x69, 0x6e])
		assert.strictEqual(view.cursor, 4)
		assert.strictEqual(view.bytesRemaining, 0)
	})

	it('should compare a positive size with the bytes that remain, not with the size of the view', function () {
		const view = new IsoBoxReadView(new Uint8Array(MAIN))

		view.jump(2)

		assert.deepStrictEqual(Array.from(view.readData(3)), [0x69, 0x6e])
		assert.strictEqual(view.cursor, 4)
		assert.strictEqual(view.bytesRemaining, 0)
	})

	it('should read from the position of a view that starts inside a buffer when the size is -1', function () {
		const buffer = new Uint8Array([0x01, 0x02, ...MAIN, 0xaa, 0xbb])
		const view = new IsoBoxReadView(buffer.subarray(2, 6))

		view.jump(1)

		assert.deepStrictEqual(Array.from(view.readData(-1)), [0x61, 0x69, 0x6e])
		assert.strictEqual(view.cursor, 4)
	})
})
