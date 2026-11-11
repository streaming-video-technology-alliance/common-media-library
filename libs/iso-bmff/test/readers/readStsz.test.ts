import { readFile } from 'node:fs/promises'
import {
	assert,
	describe,
	filterBoxes,
	findIsoBox,
	it,
	readIsoBoxes,
	readStsz,
	writeStsz,
} from '../util/box.ts'
import { fixtureFiles } from '../util/fixtureFiles.ts'

describe('readStsz', function () {
	it('should provide an example', async function () {
		// #region example
		const isoFile = await readFile(new URL('../fixtures/captions.mp4', import.meta.url))
		const boxes = readIsoBoxes(new Uint8Array(isoFile), {
			readers: {
				stsz: readStsz,
			},
		})

		const stsz = findIsoBox(boxes, box => box.type === 'stsz')

		assert.ok(stsz)
		assert.strictEqual(stsz.type, 'stsz')
		assert.strictEqual(stsz.sampleSize, 0)
		assert.strictEqual(stsz.sampleCount, 31)
		assert.strictEqual(stsz.entrySize?.[0], 687)
		// #endregion example
	})

	it('should correctly parse the box', function () {
		const boxes = filterBoxes('time_to_sample.mp4', 'stsz', { readers: { stsz: readStsz } })

		assert.strictEqual(boxes.length, 2)

		assert.strictEqual(boxes[0].type, 'stsz')
		assert.strictEqual(boxes[0].version, 0)
		assert.strictEqual(boxes[0].flags, 0)
		assert.strictEqual(boxes[0].sampleSize, 0)
		assert.strictEqual(boxes[0].sampleCount, 5)
		assert.deepStrictEqual(boxes[0].entrySize, [11410, 947, 788, 560, 482])

		assert.strictEqual(boxes[1].type, 'stsz')
		assert.strictEqual(boxes[1].sampleSize, 0)
		assert.strictEqual(boxes[1].sampleCount, 10)
		assert.deepStrictEqual(boxes[1].entrySize, [24, 6, 6, 6, 6, 6, 6, 6, 6, 6])
	})

	it('should parse a box without samples', function () {
		const boxes = filterBoxes('captions_fragmented.mp4', 'stsz', { readers: { stsz: readStsz } })
		const box = boxes[0]

		assert.strictEqual(boxes.length, 1)

		assert.strictEqual(box.type, 'stsz')
		assert.strictEqual(box.sampleSize, 0)
		assert.strictEqual(box.sampleCount, 0)
		assert.deepStrictEqual(box.entrySize, [])
	})

	it('should not read entry sizes when sampleSize is not 0', function () {
		const data = new Uint8Array([
			0,
			0,
			0,
			20, // size
			115,
			116,
			115,
			122, // type (stsz)
			0, // version
			0,
			0,
			0, // flags
			0,
			0,
			2,
			0, // sampleSize (512)
			0,
			0,
			0,
			3, // sampleCount
		])

		const boxes = readIsoBoxes(data, { readers: { stsz: readStsz } })
		const box = boxes[0]

		assert.strictEqual(boxes.length, 1)

		assert.strictEqual(box.type, 'stsz')
		assert.strictEqual(box.sampleSize, 512)
		assert.strictEqual(box.sampleCount, 3)
		assert.strictEqual(box.entrySize, undefined)

		assert.deepStrictEqual(new Uint8Array(writeStsz(box).buffer), data)
	})

	it('should return a box that writeStsz writes as the original bytes', function () {
		let count = 0

		for (const file of fixtureFiles()) {
			for (const box of filterBoxes(file, 'stsz', { readers: { stsz: readStsz } })) {
				const { view } = box
				const original = new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
				const written = writeStsz(box)

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
