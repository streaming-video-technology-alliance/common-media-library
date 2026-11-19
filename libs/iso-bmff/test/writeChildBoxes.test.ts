import {
	assert,
	beginIsoFullBox,
	createIsoBoxWriteCursor,
	describe,
	endIsoBox,
	it,
	readIsoBoxes,
	readMfhd,
	writeBytes,
	writeChildBoxes,
	writeIsoBox,
	writeIsoBoxes,
	writeMfhd,
	writeMvhd,
	writeTfdt,
	writeUint32,
	type IsoBoxWriteCursor,
	type IsoRawBox,
	type MovieFragmentHeaderBox,
} from './util/box.ts'
import { reduceUint8Arrays } from './util/reduceUint8Arrays.ts'
import { boxBytes } from './util/wideBoxes.ts'
import { written } from './util/written.ts'

const MFHD: MovieFragmentHeaderBox = { type: 'mfhd', version: 0, flags: 0, sequenceNumber: 7 }
const MFHD_BYTES = boxBytes('mfhd', new Uint8Array([0, 0, 0, 0, 0, 0, 0, 7]))
const MDAT_BYTES = boxBytes('mdat', new Uint8Array([0xaa, 0xbb]))

describe('writeChildBoxes', function () {
	it('should write each box at the position of the cursor with the writers of the cursor', function () {
		// #region example
		function writeMyBox(
			cursor: IsoBoxWriteCursor,
			box: { type: 'mybx'; children: MovieFragmentHeaderBox[] },
		): void {
			const start = beginIsoFullBox(cursor, box.type, 0, 0)

			writeChildBoxes(cursor, box.children)
			endIsoBox(cursor, start)
		}

		const cursor = createIsoBoxWriteCursor({ writers: { mfhd: writeMfhd } })

		writeMyBox(cursor, { type: 'mybx', children: [MFHD] })
		// #endregion example

		assert.deepStrictEqual(
			written(cursor),
			Array.from(boxBytes('mybx', new Uint8Array(4), MFHD_BYTES)),
		)
	})

	it('should write the bytes of a raw box before a writer of its type', function () {
		const raw = readIsoBoxes(MFHD_BYTES) as IsoRawBox[]
		const cursor = createIsoBoxWriteCursor({
			writers: {
				mfhd: (): never => {
					throw new Error('writer called')
				},
			},
		})

		writeChildBoxes(cursor, raw)

		assert.deepStrictEqual(written(cursor), Array.from(MFHD_BYTES))
	})

	it('should copy an ArrayBufferView', function () {
		const cursor = createIsoBoxWriteCursor()

		writeChildBoxes(cursor, [MDAT_BYTES, new DataView(MFHD_BYTES.buffer)])

		assert.deepStrictEqual(written(cursor), [...MDAT_BYTES, ...MFHD_BYTES])
	})

	it('should throw for a box with no writer, no bytes, and a type outside the containers', function () {
		const cursor = createIsoBoxWriteCursor()

		assert.throws(
			() => writeChildBoxes(cursor, [{ type: 'meta', version: 0, flags: 0, boxes: [] }]),
			/^Error: No writer found for box type: meta$/,
		)
	})

	it('should throw for a box from a reader with no writer', function () {
		const boxes = readIsoBoxes(MFHD_BYTES, { readers: { mfhd: readMfhd } })

		assert.throws(() => writeIsoBoxes(boxes), /No writer found for box type: mfhd/)
	})

	it('should use the url key for a url box', function () {
		const cursor = createIsoBoxWriteCursor({
			writers: {
				url: (c: IsoBoxWriteCursor) => writeUint32(c, 1),
			},
		})

		writeChildBoxes(cursor, [{ type: 'url ', version: 0, flags: 1 }])

		assert.deepStrictEqual(written(cursor), [0, 0, 0, 1])
	})
})

describe('writeIsoBoxes on the write cursor', function () {
	it('should return one array with every box', function () {
		const bytes = writeIsoBoxes([MFHD, MDAT_BYTES], { writers: { mfhd: writeMfhd } })

		assert.ok(bytes instanceof Uint8Array)
		assert.deepStrictEqual(bytes, reduceUint8Arrays([MFHD_BYTES, MDAT_BYTES]))
		assert.strictEqual(bytes.buffer.byteLength, bytes.length)
	})

	it('should write the child boxes of a container with the writers of the configuration', function () {
		const mvhd = {
			type: 'mvhd' as const,
			version: 0,
			flags: 0,
			creationTime: 0,
			modificationTime: 0,
			timescale: 1000,
			duration: 0,
			rate: 1,
			volume: 1,
			matrix: [1, 0, 0, 0, 1, 0, 0, 0, 1],
			preDefined: [0, 0, 0, 0, 0, 0],
			nextTrackId: 2,
		}
		const moov = writeIsoBox({ type: 'moov', boxes: [mvhd] }, { writers: { mvhd: writeMvhd } })
		const alone = writeIsoBox(mvhd, { writers: { mvhd: writeMvhd } })

		assert.deepStrictEqual(moov.subarray(8), alone)
		assert.strictEqual(new DataView(moov.buffer).getUint32(0), alone.length + 8)
	})

	it('should use the writer of a container type in place of the child boxes', function () {
		const marker = [0, 0, 0, 9, 0x74, 0x72, 0x61, 0x66, 7]
		const writers = {
			traf: (cursor: IsoBoxWriteCursor) => writeBytes(cursor, marker),
		}

		assert.deepStrictEqual(
			Array.from(writeIsoBoxes([{ type: 'traf', boxes: [] }], { writers })),
			marker,
		)
	})

	it('should not catch an error of a writer', function () {
		const error = new Error('bad tfdt')

		assert.throws(
			() =>
				writeIsoBoxes([{ type: 'tfdt', version: 0, flags: 0, baseMediaDecodeTime: 0 }], {
					writers: {
						tfdt: () => {
							throw error
						},
					},
				}),
			(thrown: unknown) => thrown === error,
		)
		assert.ok(writeTfdt)
	})
})
