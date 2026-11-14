import {
	assert,
	defaultReaderConfig,
	defaultWriterConfig,
	describe,
	IsoBoxReadView,
	it,
	readIsoBoxes,
	writeIsoBoxes,
} from './util/box.ts'
import { reduceUint8Arrays } from './util/reduceUint8Arrays.ts'
import { boxBytes } from './util/wideBoxes.ts'

// The fields of a parsed box that the tests compare.
type Tree = { type: string; size: number; boxes?: Tree[] }

const ascii = (text: string): Uint8Array => new TextEncoder().encode(text)
const read = (bytes: Uint8Array): Tree[] => readIsoBoxes(bytes, defaultReaderConfig()) as Tree[]
const types = (boxes: Tree[] = []): string[] => boxes.map(box => box.type)

const FTYP = boxBytes('ftyp', ascii('isom'), [0, 4])
const FREE = boxBytes('free', new Uint8Array([1, 2, 3, 4]))
const ZEROS = new Uint8Array(4)

// A header with the size 100 and 4 bytes of the body.
const CUT_BODY = reduceUint8Arrays([new Uint8Array([0, 0, 0, 100]), ascii('moov'), ZEROS])

// The first 12 bytes of a 16-byte header: the size 1, the type, and half of the largesize.
const CUT_LARGE_HEADER = reduceUint8Arrays([new Uint8Array([0, 0, 0, 1]), ascii('mdat'), ZEROS])

describe('incomplete box header', function () {
	for (const length of [1, 4, 7]) {
		it(`should stop before ${length} bytes after the last top-level box`, function () {
			const bytes = reduceUint8Arrays([FTYP, new Uint8Array(length)])

			assert.deepStrictEqual(types(read(bytes)), ['ftyp'])
		})
	}

	it('should stop before 4 bytes after the last child box of a container', function () {
		const udta = boxBytes('udta', FREE, ZEROS)
		const bytes = boxBytes('moov', udta, FREE)

		const [moov] = read(bytes)
		const [box] = moov?.boxes ?? []

		assert.deepStrictEqual(types(moov?.boxes), ['udta', 'free'])
		assert.deepStrictEqual(types(box?.boxes), ['free'])
		assert.strictEqual(box?.size, udta.length)
	})

	it('should stop before 4 bytes after the last child box of a sample entry', function () {
		const bytes = boxBytes('avc1', new Uint8Array(78), FREE, ZEROS)

		const [box] = read(bytes)

		assert.strictEqual(box?.type, 'avc1')
		assert.deepStrictEqual(types(box?.boxes), ['free'])
		assert.strictEqual(box?.size, bytes.length)
	})

	it('should stop before a 16-byte header that the buffer cuts after 12 bytes', function () {
		const bytes = reduceUint8Arrays([FTYP, CUT_LARGE_HEADER])

		assert.deepStrictEqual(types(read(bytes)), ['ftyp'])
	})

	it('should stop before a box that the buffer cuts inside the body', function () {
		const bytes = reduceUint8Arrays([FTYP, CUT_BODY])

		assert.deepStrictEqual(types(read(bytes)), ['ftyp'])
	})

	it('should throw the same error from readBox for a cut header and a cut body', function () {
		const expected = { name: 'Error', message: 'Truncated box' }

		assert.throws(() => new IsoBoxReadView(CUT_BODY).readBox(), expected)
		assert.throws(() => new IsoBoxReadView(ZEROS).readBox(), expected)
		assert.throws(() => new IsoBoxReadView(CUT_LARGE_HEADER).readBox(), expected)
	})

	it('should omit the bytes after the last child box of a container in a write', function () {
		const source = boxBytes('moov', boxBytes('udta', FREE, ZEROS))

		const boxes = readIsoBoxes(source, defaultReaderConfig())
		const written = reduceUint8Arrays(writeIsoBoxes(boxes, defaultWriterConfig()))

		assert.strictEqual(written.length, source.length - ZEROS.length)
		assert.deepStrictEqual(written, boxBytes('moov', boxBytes('udta', FREE)))
	})

	it('should omit the bytes after the last child box of a sample entry in a write', function () {
		const fields = new Uint8Array(78)
		const source = boxBytes('avc1', fields, FREE, ZEROS)

		const boxes = readIsoBoxes(source, defaultReaderConfig())
		const written = reduceUint8Arrays(writeIsoBoxes(boxes, defaultWriterConfig()))

		assert.strictEqual(written.length, source.length - ZEROS.length)
		assert.deepStrictEqual(written, boxBytes('avc1', fields, FREE))
	})
})

// An 8-byte header with a declared size.
const header = (size: number, type: string): Uint8Array =>
	reduceUint8Arrays([new Uint8Array([0, 0, 0, size]), ascii(type)])

// A 16-byte header: the size 1, the type, and a declared largesize.
const largeHeader = (largesize: number, type: string): Uint8Array =>
	reduceUint8Arrays([header(1, type), ZEROS, new Uint8Array([0, 0, 0, largesize])])

// Reads the boxes with the iterator and stops at a limit.
const readWithLimit = (bytes: Uint8Array, limit: number): Tree[] => {
	const boxes: Tree[] = []

	for (const box of new IsoBoxReadView(bytes, defaultReaderConfig())) {
		if (boxes.push(box as Tree) === limit) {
			break
		}
	}

	return boxes
}

describe('box size below the header size', function () {
	it('should stop before a box with the size 1 and the largesize 0', function () {
		const bytes = largeHeader(0, 'free')

		assert.deepStrictEqual(types(readWithLimit(bytes, 5)), [])
	})

	it('should return the boxes before a box with the size 1 and the largesize 0', function () {
		const bytes = reduceUint8Arrays([FTYP, largeHeader(0, 'free'), FREE])

		assert.deepStrictEqual(types(readWithLimit(bytes, 5)), ['ftyp'])
	})

	it('should stop before a box with the size 4 after a complete box', function () {
		const bytes = reduceUint8Arrays([FTYP, header(4, 'free'), FREE])

		assert.deepStrictEqual(types(read(bytes)), ['ftyp'])
	})

	it('should return no box for the size 2 before 200000 zero bytes', function () {
		const bytes = reduceUint8Arrays([header(2, 'free'), new Uint8Array(200000)])

		assert.deepStrictEqual(types(read(bytes)), [])
	})

	for (const [size, type] of [
		[4, 'ftyp'],
		[7, 'mvhd'],
	] as const) {
		it(`should not throw for a ${type} box with the size ${size}`, function () {
			const bytes = reduceUint8Arrays([header(size, type), FREE])

			assert.deepStrictEqual(types(read(bytes)), [])
		})
	}

	for (const largesize of [1, 8, 15]) {
		it(`should stop before a box with the size 1 and the largesize ${largesize}`, function () {
			const bytes = reduceUint8Arrays([FTYP, largeHeader(largesize, 'free'), FREE])

			assert.deepStrictEqual(types(read(bytes)), ['ftyp'])
		})
	}

	it('should stop before a child box with the size 4 and read the boxes after the container', function () {
		const udta = boxBytes('udta', FREE, header(4, 'skip'), FREE)
		const bytes = reduceUint8Arrays([boxBytes('moov', udta, FREE), FTYP])

		const boxes = read(bytes)
		const [moov] = boxes
		const [box] = moov?.boxes ?? []

		assert.deepStrictEqual(types(boxes), ['moov', 'ftyp'])
		assert.deepStrictEqual(types(moov?.boxes), ['udta', 'free'])
		assert.deepStrictEqual(types(box?.boxes), ['free'])
		assert.strictEqual(box?.size, udta.length)
	})

	it('should read a box with the size 8 and the box after it', function () {
		const bytes = reduceUint8Arrays([header(8, 'free'), FREE])

		const boxes = read(bytes)

		assert.deepStrictEqual(types(boxes), ['free', 'free'])
		assert.deepStrictEqual(
			boxes.map(box => box.size),
			[8, FREE.length],
		)
	})

	it('should read a box with the size 1 and the largesize 16 and the box after it', function () {
		const bytes = reduceUint8Arrays([largeHeader(16, 'free'), FREE])

		const boxes = readIsoBoxes(bytes, defaultReaderConfig())

		assert.deepStrictEqual(
			boxes.map(box => box.type),
			['free', 'free'],
		)
		assert.strictEqual(boxes[0]?.size, 1)
		assert.strictEqual(boxes[0]?.largesize, 16)
	})

	it('should read a last box with the size 0 to the end of the data', function () {
		const bytes = reduceUint8Arrays([FTYP, header(0, 'mdat'), ZEROS])

		const boxes = readIsoBoxes(bytes, defaultReaderConfig())
		const mdat = boxes[1]

		assert.deepStrictEqual(
			boxes.map(box => box.type),
			['ftyp', 'mdat'],
		)
		assert.strictEqual(mdat?.size, 0)
		assert.strictEqual(mdat?.view.byteLength, 8 + ZEROS.length)
	})

	it('should read a last box with the size 0 and no body', function () {
		const bytes = reduceUint8Arrays([FTYP, header(0, 'free')])

		assert.deepStrictEqual(types(read(bytes)), ['ftyp', 'free'])
	})

	for (const size of [8, 23]) {
		it(`should stop before a last uuid box with the size ${size}`, function () {
			const bytes = reduceUint8Arrays([FTYP, header(size, 'uuid'), new Uint8Array(size - 8)])

			assert.deepStrictEqual(types(read(bytes)), ['ftyp'])
		})
	}

	it('should stop before a uuid box with the size 8 after a complete box', function () {
		const bytes = reduceUint8Arrays([FTYP, header(8, 'uuid'), FREE, FREE])

		assert.deepStrictEqual(types(read(bytes)), ['ftyp'])
	})

	it('should stop before a last child uuid box with the size 8 and read the boxes after the container', function () {
		const bytes = reduceUint8Arrays([boxBytes('moov', FREE, header(8, 'uuid')), FTYP])

		const boxes = read(bytes)

		assert.deepStrictEqual(types(boxes), ['moov', 'ftyp'])
		assert.deepStrictEqual(types(boxes[0]?.boxes), ['free'])
	})

	it('should stop before a uuid box with the size 1 and the largesize 31', function () {
		const bytes = reduceUint8Arrays([FTYP, largeHeader(31, 'uuid'), new Uint8Array(15)])

		assert.deepStrictEqual(types(read(bytes)), ['ftyp'])
	})

	it('should read a uuid box with the size 24 and the box after it', function () {
		const usertype = Uint8Array.from({ length: 16 }, (_, i) => i + 1)
		const bytes = reduceUint8Arrays([header(24, 'uuid'), usertype, FREE])

		const boxes = readIsoBoxes(bytes, defaultReaderConfig())

		assert.deepStrictEqual(
			boxes.map(box => box.type),
			['uuid', 'free'],
		)
		assert.deepStrictEqual(boxes[0]?.usertype, Array.from(usertype))
	})

	it('should read a uuid box with the size 1 and the largesize 32 and the box after it', function () {
		const usertype = Uint8Array.from({ length: 16 }, (_, i) => i + 1)
		const bytes = reduceUint8Arrays([largeHeader(32, 'uuid'), usertype, FREE])

		const boxes = readIsoBoxes(bytes, defaultReaderConfig())

		assert.deepStrictEqual(
			boxes.map(box => box.type),
			['uuid', 'free'],
		)
		assert.deepStrictEqual(boxes[0]?.usertype, Array.from(usertype))
	})

	it('should throw the same error from readBox as for a cut box', function () {
		const expected = { name: 'Error', message: 'Truncated box' }

		for (const bytes of [
			reduceUint8Arrays([header(4, 'free'), FREE]),
			reduceUint8Arrays([header(7, 'free'), FREE]),
			largeHeader(0, 'free'),
			reduceUint8Arrays([largeHeader(15, 'free'), FREE]),
			header(8, 'uuid'),
			reduceUint8Arrays([header(23, 'uuid'), FREE, FREE]),
			reduceUint8Arrays([largeHeader(31, 'uuid'), FREE, FREE]),
		]) {
			const view = new IsoBoxReadView(bytes)

			assert.throws(() => view.readBox(), expected)
			assert.strictEqual(view.done, true)
			assert.strictEqual(view.cursor, 0)
		}
	})
})
