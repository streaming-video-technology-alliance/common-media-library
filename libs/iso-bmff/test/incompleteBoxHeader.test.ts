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
