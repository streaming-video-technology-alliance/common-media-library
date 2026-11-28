import { load } from './util/load.ts'
import { reduceUint8Arrays } from './util/reduceUint8Arrays.ts'
import { boxBytes } from './util/wideBoxes.ts'
import { assert, describe, it, readIsoBoxSize } from './util/box.ts'

function viewOf(bytes: Uint8Array): DataView {
	return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
}

// A box with a largesize field: size 1, the type, then the size in 8 bytes.
function largeBox(type: string, size: number, length: number = size): DataView {
	const bytes = new Uint8Array(length)
	const view = viewOf(bytes)

	view.setUint32(0, 1)
	bytes.set(boxBytes(type).subarray(4, 8), 4)

	if (length >= 16) {
		view.setUint32(12, size)
	}

	return view
}

describe('readIsoBoxSize', function () {
	it('should return the size of each box', function () {
		// #region example
		const view = new DataView(load('mss_moof_tfdt.mp4'))
		const sizes: number[] = []
		let at = 0
		let size = readIsoBoxSize(view, at, view.byteLength)

		while (size) {
			sizes.push(size) // the moof box, then the mdat box
			at += size
			size = readIsoBoxSize(view, at, view.byteLength)
		}
		// #endregion example

		assert.deepStrictEqual(sizes, [848, 23912])
		assert.strictEqual(at, view.byteLength)
	})

	it('should return the size of a box at a position after 0', function () {
		const view = viewOf(reduceUint8Arrays([boxBytes('free'), boxBytes('mdat', new Uint8Array(3))]))

		assert.strictEqual(readIsoBoxSize(view, 8, view.byteLength), 11)
	})

	it('should count the positions from the first byte of the view', function () {
		const bytes = reduceUint8Arrays([new Uint8Array(5), boxBytes('free', new Uint8Array(2))])
		const view = viewOf(bytes.subarray(5))

		assert.strictEqual(readIsoBoxSize(view, 0, view.byteLength), 10)
	})

	it('should return the bytes to the end for a box with a size of 0', function () {
		const bytes = boxBytes('mdat', new Uint8Array(4))
		const view = viewOf(bytes)

		view.setUint32(0, 0)

		assert.strictEqual(readIsoBoxSize(view, 0, 12), 12)
		assert.strictEqual(readIsoBoxSize(view, 0, 10), 10)
	})

	it('should return the size of a box with a largesize', function () {
		assert.strictEqual(readIsoBoxSize(largeBox('mdat', 17), 0, 17), 17)
		assert.strictEqual(readIsoBoxSize(largeBox('mdat', 16), 0, 16), 16)
	})

	it('should return 0 at the end', function () {
		const view = viewOf(boxBytes('free'))

		assert.strictEqual(readIsoBoxSize(view, 8, 8), 0)
	})

	it('should return 0 for fewer than 8 bytes', function () {
		const view = viewOf(boxBytes('free'))

		assert.strictEqual(readIsoBoxSize(view, 0, 7), 0)
		assert.strictEqual(readIsoBoxSize(view, 1, 8), 0)
	})

	it('should return 0 for a largesize box with fewer than 16 bytes', function () {
		assert.strictEqual(readIsoBoxSize(largeBox('mdat', 17, 15), 0, 15), 0)
	})

	it('should return 0 for a size below the header size', function () {
		const view = viewOf(boxBytes('free'))

		view.setUint32(0, 7)

		assert.strictEqual(readIsoBoxSize(view, 0, 8), 0)
		assert.strictEqual(readIsoBoxSize(largeBox('mdat', 15, 16), 0, 16), 0)
	})

	it('should return 0 for a box that passes the end', function () {
		const view = viewOf(boxBytes('free', new Uint8Array(4)))

		assert.strictEqual(readIsoBoxSize(view, 0, 11), 0)
		assert.strictEqual(readIsoBoxSize(largeBox('mdat', 18, 17), 0, 17), 0)
	})

	it('should return 0 for a uuid box with fewer than 16 bytes after its header', function () {
		const view = viewOf(boxBytes('uuid', new Uint8Array(15)))

		assert.strictEqual(readIsoBoxSize(view, 0, 23), 0)
		assert.strictEqual(readIsoBoxSize(largeBox('uuid', 31), 0, 31), 0)
	})

	it('should return the size of a uuid box with 16 bytes after its header', function () {
		const view = viewOf(boxBytes('uuid', new Uint8Array(16)))

		assert.strictEqual(readIsoBoxSize(view, 0, 24), 24)
		assert.strictEqual(readIsoBoxSize(largeBox('uuid', 32), 0, 32), 32)
	})

	it('should return the size of a short uuid box with ignoreUserType', function () {
		const view = viewOf(boxBytes('uuid'))

		assert.strictEqual(readIsoBoxSize(view, 0, 8, true), 8)
		assert.strictEqual(readIsoBoxSize(largeBox('uuid', 16), 0, 16, true), 16)
		assert.strictEqual(readIsoBoxSize(view, 0, 7, true), 0)
	})
})
