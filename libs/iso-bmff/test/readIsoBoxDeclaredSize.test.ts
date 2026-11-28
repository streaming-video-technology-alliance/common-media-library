import { load } from './util/load.ts'
import { reduceUint8Arrays } from './util/reduceUint8Arrays.ts'
import { boxBytes } from './util/wideBoxes.ts'
import {
	assert,
	describe,
	it,
	readChildBoxes,
	readIsoBoxDeclaredSize,
	readIsoBoxHeaderSize,
	readIsoBoxSize,
	type IsoBoxReadCursor,
} from './util/box.ts'

const USERTYPE = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])

// A box with size 1 and the given largesize. The bytes hold the header and the body.
function largeBox(type: string, body: Uint8Array, high: number = 0, low?: number): Uint8Array {
	const bytes = new Uint8Array(16 + body.length)
	const view = new DataView(bytes.buffer)

	view.setUint32(0, 1)
	bytes.set(
		[...type].map(char => char.charCodeAt(0)),
		4,
	)
	view.setUint32(8, high)
	view.setUint32(12, low ?? bytes.length)
	bytes.set(body, 16)

	return bytes
}

function viewOf(bytes: Uint8Array): DataView {
	return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
}

describe('readIsoBoxDeclaredSize', function () {
	it('should return the declared size of a box that the data truncates', function () {
		// #region example
		// The first 100 bytes of a segment: the moof box is not complete.
		const view = new DataView(load('mss_moof_tfdt.mp4'), 0, 100)
		const end = view.byteLength
		const size = readIsoBoxSize(view, 0, end) // 0: the moof box is not complete
		const declared = readIsoBoxDeclaredSize(view, 0, end) // the size of the complete moof box
		const truncated = !size && declared > end

		// A cursor over the available bytes of the moof box, after its header.
		const moof: IsoBoxReadCursor = { view, start: 0, pos: readIsoBoxHeaderSize(view, 0), end }
		const boxes = readChildBoxes(moof) // the complete child boxes: mfhd
		// #endregion example

		assert.strictEqual(size, 0)
		assert.strictEqual(declared, new DataView(load('mss_moof_tfdt.mp4')).getUint32(0))
		assert.ok(declared > 100)
		assert.strictEqual(truncated, true)
		assert.deepStrictEqual(
			boxes.map(box => box.type),
			['mfhd'],
		)
	})

	it('should return the size of a complete box, as readIsoBoxSize does', function () {
		const bytes = reduceUint8Arrays([boxBytes('free'), boxBytes('mdat', new Uint8Array(4))])
		const view = viewOf(bytes)

		assert.strictEqual(readIsoBoxDeclaredSize(view, 0, bytes.length), 8)
		assert.strictEqual(readIsoBoxDeclaredSize(view, 8, bytes.length), 12)
		assert.strictEqual(readIsoBoxSize(view, 8, bytes.length), 12)
	})

	it('should return the exact declared size above the remaining bytes', function () {
		const bytes = boxBytes('moof', new Uint8Array(92)).subarray(0, 40)

		assert.strictEqual(readIsoBoxDeclaredSize(viewOf(bytes), 0, 40), 100)
		assert.strictEqual(readIsoBoxSize(viewOf(bytes), 0, 40), 0)
	})

	it('should return 0 only for an incomplete header', function () {
		const box = boxBytes('moof', new Uint8Array(8))
		const large = largeBox('mdat', new Uint8Array(4))

		assert.strictEqual(readIsoBoxDeclaredSize(viewOf(box), 0, 0), 0)
		assert.strictEqual(readIsoBoxDeclaredSize(viewOf(box), 0, 3), 0)
		assert.strictEqual(readIsoBoxDeclaredSize(viewOf(box), 0, 7), 0)
		assert.strictEqual(readIsoBoxDeclaredSize(viewOf(box), 0, 8), 16)
		assert.strictEqual(readIsoBoxDeclaredSize(viewOf(large), 0, 8), 0)
		assert.strictEqual(readIsoBoxDeclaredSize(viewOf(large), 0, 15), 0)
		assert.strictEqual(readIsoBoxDeclaredSize(viewOf(large), 0, 16), 20)
	})

	it('should return an invalid size as the header declares it', function () {
		const small = boxBytes('moof', new Uint8Array(32))
		const large = largeBox('mdat', new Uint8Array(24), 0, 10)
		const uuid = boxBytes('uuid', new Uint8Array(4))

		new DataView(small.buffer).setUint32(0, 4)

		// readIsoBoxSize returns 0 for each box. The declared size is not above the remaining bytes, so the size is invalid.
		assert.strictEqual(readIsoBoxDeclaredSize(viewOf(small), 0, small.length), 4)
		assert.strictEqual(readIsoBoxSize(viewOf(small), 0, small.length), 0)
		assert.strictEqual(readIsoBoxDeclaredSize(viewOf(large), 0, large.length), 10)
		assert.strictEqual(readIsoBoxSize(viewOf(large), 0, large.length), 0)
		assert.strictEqual(readIsoBoxDeclaredSize(viewOf(uuid), 0, uuid.length), 12)
		assert.strictEqual(readIsoBoxSize(viewOf(uuid), 0, uuid.length), 0)
	})

	it('should read both words of largesize', function () {
		// largesize is 2 ** 32 + 24, and the data has 24 bytes.
		const bytes = largeBox('mdat', new Uint8Array(8), 1, 24)

		assert.strictEqual(readIsoBoxDeclaredSize(viewOf(bytes), 0, bytes.length), 4294967320)
		assert.strictEqual(readIsoBoxSize(viewOf(bytes), 0, bytes.length), 0)
	})

	it('should return the bytes to end for a size of 0', function () {
		const bytes = reduceUint8Arrays([boxBytes('free'), boxBytes('mdat', new Uint8Array(12))])

		new DataView(bytes.buffer).setUint32(8, 0)

		assert.strictEqual(readIsoBoxDeclaredSize(viewOf(bytes), 8, bytes.length), 20)
		assert.strictEqual(readIsoBoxDeclaredSize(viewOf(bytes), 8, 18), 10)
	})
})

describe('readIsoBoxHeaderSize', function () {
	it('should return the size of the header of each box', function () {
		// #region header
		const bytes = reduceUint8Arrays([
			boxBytes('free'),
			largeBox('mdat', new Uint8Array(2)),
			boxBytes('uuid', USERTYPE, new Uint8Array(2)),
		])
		const view = new DataView(bytes.buffer)
		const headers: number[] = []
		let at = 0
		let size = readIsoBoxSize(view, at, view.byteLength)

		while (size) {
			headers.push(readIsoBoxHeaderSize(view, at)) // 8, 16, 8
			at += size
			size = readIsoBoxSize(view, at, view.byteLength)
		}
		// #endregion header

		assert.deepStrictEqual(headers, [8, 16, 8])
	})

	it('should return 16 for a uuid box with largesize and 8 for a size of 0', function () {
		const uuid = largeBox('uuid', USERTYPE)
		const open = boxBytes('mdat', new Uint8Array(4))

		new DataView(open.buffer).setUint32(0, 0)

		assert.strictEqual(readIsoBoxHeaderSize(viewOf(uuid), 0), 16)
		assert.strictEqual(readIsoBoxHeaderSize(viewOf(open), 0), 8)
	})
})
