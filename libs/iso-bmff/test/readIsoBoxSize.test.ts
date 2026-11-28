import { load } from './util/load.ts'
import { reduceUint8Arrays } from './util/reduceUint8Arrays.ts'
import { boxBytes } from './util/wideBoxes.ts'
import {
	assert,
	createIsoBoxReadCursor,
	describe,
	it,
	nextIsoBox,
	readChildBoxes,
	readIsoBoxHeaderSize,
	readIsoBoxSize,
	type IsoBoxReadCursor,
} from './util/box.ts'

const USERTYPE = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
const MDAT = boxBytes('mdat', new Uint8Array([0xaa, 0xbb]))

function largeBox(type: string, body: Uint8Array): Uint8Array {
	const bytes = new Uint8Array(16 + body.length)
	const view = new DataView(bytes.buffer)

	view.setUint32(0, 1)
	bytes.set(
		[...type].map(char => char.charCodeAt(0)),
		4,
	)
	view.setUint32(12, bytes.length)
	bytes.set(body, 16)

	return bytes
}

describe('readIsoBoxSize', function () {
	it('should read the boxes of a box that the data truncates', function () {
		// #region example
		// The first 100 bytes of a segment: the moof box is not complete.
		const partial = new Uint8Array(load('mss_moof_tfdt.mp4'), 0, 100)
		const cursor = createIsoBoxReadCursor(partial)
		const size = readIsoBoxSize(cursor, 0) // the size of the complete moof box, above 100
		const truncated = size > cursor.end - cursor.start

		// A cursor over the available bytes of the moof box, after its header.
		const moof: IsoBoxReadCursor = {
			...cursor,
			start: 0,
			pos: readIsoBoxHeaderSize(cursor, 0),
			end: cursor.end,
		}
		const boxes = readChildBoxes(moof) // the complete child boxes: mfhd
		// #endregion example

		assert.ok(size > 100)
		assert.strictEqual(truncated, true)
		assert.strictEqual(nextIsoBox(cursor), null)
		assert.deepStrictEqual(
			boxes.map(box => box.type),
			['mfhd'],
		)
	})

	it('should return the declared size of a complete box', function () {
		const data = load('mss_moof_tfdt.mp4')
		const cursor = createIsoBoxReadCursor(data)
		const size = readIsoBoxSize(cursor, 0)

		assert.strictEqual(size, new DataView(data).getUint32(0))
		assert.strictEqual(nextIsoBox(cursor), 'moof')
		assert.strictEqual(cursor.pos, size)
	})

	it('should return the size from largesize', function () {
		const bytes = largeBox('mdat', new Uint8Array([1, 2, 3]))
		const cursor = createIsoBoxReadCursor(bytes)

		assert.strictEqual(readIsoBoxSize(cursor, 0), 19)
	})

	it('should return the remaining bytes for a size of 0', function () {
		const bytes = reduceUint8Arrays([MDAT, boxBytes('free', new Uint8Array(10))])
		const cursor = createIsoBoxReadCursor(bytes)

		new DataView(bytes.buffer).setUint32(MDAT.length, 0)

		assert.strictEqual(readIsoBoxSize(cursor, MDAT.length), 18)
	})

	it('should return 0 for a size below the header size', function () {
		const uuid = boxBytes('uuid', USERTYPE, new Uint8Array(4))
		const cursor = createIsoBoxReadCursor(reduceUint8Arrays([MDAT, uuid]))

		new DataView(uuid.buffer).setUint32(0, 20)

		assert.strictEqual(readIsoBoxSize(createIsoBoxReadCursor(uuid), 0), 0)
		assert.strictEqual(readIsoBoxSize(cursor, MDAT.length), 28)
		assert.strictEqual(
			readIsoBoxSize(createIsoBoxReadCursor(boxBytes('free').subarray(0, 7)), 0),
			0,
		)
	})

	it('should return 0 for a largesize with fewer than 16 bytes', function () {
		const bytes = largeBox('mdat', new Uint8Array(4)).subarray(0, 12)

		assert.strictEqual(readIsoBoxSize(createIsoBoxReadCursor(bytes), 0), 0)
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
		const cursor = createIsoBoxReadCursor(bytes)
		const headers: number[] = []

		for (let at = 0; at < cursor.end; at += readIsoBoxSize(cursor, at)) {
			headers.push(readIsoBoxHeaderSize(cursor, at)) // 8, 16, 24
		}
		// #endregion header

		assert.deepStrictEqual(headers, [8, 16, 24])
	})

	it('should return 0 with fewer than 8 bytes', function () {
		assert.strictEqual(readIsoBoxHeaderSize(createIsoBoxReadCursor(new Uint8Array(7)), 0), 0)
	})
})
