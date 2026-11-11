import { readFile } from 'node:fs/promises'
import {
	assert,
	describe,
	filterBoxes,
	findIsoBox,
	it,
	readIsoBoxes,
	readStco,
	writeStco,
} from '../util/box.ts'
import { fixtureFiles } from '../util/fixtureFiles.ts'

describe('readStco', function () {
	it('should provide an example', async function () {
		// #region example
		const isoFile = await readFile(new URL('../fixtures/captions.mp4', import.meta.url))
		const boxes = readIsoBoxes(new Uint8Array(isoFile), {
			readers: {
				stco: readStco,
			},
		})

		const stco = findIsoBox(boxes, box => box.type === 'stco')

		assert.ok(stco)
		assert.strictEqual(stco.type, 'stco')
		assert.strictEqual(stco.entryCount, 30)
		assert.strictEqual(stco.chunkOffset[0], 1056)
		// #endregion example
	})

	it('should correctly parse the box', function () {
		const boxes = filterBoxes('time_to_sample.mp4', 'stco', { readers: { stco: readStco } })

		assert.strictEqual(boxes.length, 2)

		assert.strictEqual(boxes[0].type, 'stco')
		assert.strictEqual(boxes[0].version, 0)
		assert.strictEqual(boxes[0].flags, 0)
		assert.strictEqual(boxes[0].entryCount, 4)
		assert.deepStrictEqual(boxes[0].chunkOffset, [48, 12429, 13229, 13801])

		assert.strictEqual(boxes[1].type, 'stco')
		assert.strictEqual(boxes[1].entryCount, 4)
		assert.deepStrictEqual(boxes[1].chunkOffset, [12405, 13217, 13789, 14283])
	})

	it('should parse a box without entries', function () {
		const boxes = filterBoxes('captions_fragmented.mp4', 'stco', { readers: { stco: readStco } })
		const box = boxes[0]

		assert.strictEqual(boxes.length, 1)

		assert.strictEqual(box.type, 'stco')
		assert.strictEqual(box.entryCount, 0)
		assert.deepStrictEqual(box.chunkOffset, [])
	})

	it('should read a chunk offset of 2^31 or greater as unsigned', function () {
		const data = new Uint8Array([
			0,
			0,
			0,
			24, // size
			115,
			116,
			99,
			111, // type (stco)
			0, // version
			0,
			0,
			0, // flags
			0,
			0,
			0,
			2, // entryCount
			128,
			0,
			0,
			0, // chunkOffset[0] (2147483648)
			255,
			255,
			255,
			255, // chunkOffset[1] (4294967295)
		])

		const boxes = readIsoBoxes(data, { readers: { stco: readStco } })
		const box = boxes[0]

		assert.strictEqual(boxes.length, 1)

		assert.strictEqual(box.type, 'stco')
		assert.strictEqual(box.entryCount, 2)
		assert.deepStrictEqual(box.chunkOffset, [2147483648, 4294967295])

		assert.deepStrictEqual(new Uint8Array(writeStco(box).buffer), data)
	})

	it('should return a box that writeStco writes as the original bytes', function () {
		let count = 0

		for (const file of fixtureFiles()) {
			for (const box of filterBoxes(file, 'stco', { readers: { stco: readStco } })) {
				const { view } = box
				const original = new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
				const written = writeStco(box)

				assert.deepStrictEqual(
					new Uint8Array(written.buffer, written.byteOffset, written.byteLength),
					original,
					file,
				)
				count++
			}
		}

		assert.ok(count > 0)
	})
})
