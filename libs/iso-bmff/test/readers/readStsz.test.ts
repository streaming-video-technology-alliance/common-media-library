import { writeWith } from '../util/writeWith.ts'
import { readFile } from 'node:fs/promises'
import { rawBytes } from '../util/rawBytes.ts'
import {
	assert,
	describe,
	filterBoxes,
	findIsoBox,
	isIsoBoxType,
	it,
	readIsoBoxes,
	readStsz,
	writeStsz,
} from '../util/box.ts'
import { fixtureFiles } from '../util/fixtureFiles.ts'
import { boxBytes } from '../util/wideBoxes.ts'

describe('readStsz', function () {
	it('should provide an example', async function () {
		// #region example
		const isoFile = await readFile(new URL('../fixtures/captions.mp4', import.meta.url))
		const boxes = readIsoBoxes(isoFile, {
			readers: {
				stsz: readStsz,
			},
		})

		const stsz = findIsoBox(boxes, box => isIsoBoxType('stsz', box))

		assert.ok(stsz)
		assert.ok(isIsoBoxType('stsz', stsz))
		assert.strictEqual(stsz.sampleSize, 0)
		assert.strictEqual(stsz.entrySize?.length, 31)
		assert.strictEqual(stsz.entrySize?.[0], 687)
		// #endregion example
	})

	it('should correctly parse the box', function () {
		const boxes = filterBoxes('time_to_sample.mp4', 'stsz', { readers: { stsz: readStsz } })

		assert.strictEqual(boxes.length, 2)

		assert.ok(isIsoBoxType('stsz', boxes[0]))
		assert.strictEqual(boxes[0].version, 0)
		assert.strictEqual(boxes[0].flags, 0)
		assert.strictEqual(boxes[0].sampleSize, 0)
		assert.strictEqual(boxes[0].entrySize?.length, 5)
		assert.deepStrictEqual(boxes[0].entrySize, [11410, 947, 788, 560, 482])

		assert.ok(isIsoBoxType('stsz', boxes[1]))
		assert.strictEqual(boxes[1].sampleSize, 0)
		assert.strictEqual(boxes[1].entrySize?.length, 10)
		assert.deepStrictEqual(boxes[1].entrySize, [24, 6, 6, 6, 6, 6, 6, 6, 6, 6])
	})

	it('should parse a box without samples', function () {
		const boxes = filterBoxes('captions_fragmented.mp4', 'stsz', { readers: { stsz: readStsz } })
		const box = boxes[0]

		assert.strictEqual(boxes.length, 1)

		assert.ok(isIsoBoxType('stsz', box))
		assert.strictEqual(box.sampleSize, 0)
		assert.strictEqual(box.entrySize?.length, 0)
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

		assert.ok(isIsoBoxType('stsz', box))
		assert.strictEqual(box.sampleSize, 512)
		assert.strictEqual(box.sampleCount, 3)
		assert.strictEqual(box.entrySize, undefined)

		assert.deepStrictEqual(new Uint8Array(writeWith(writeStsz, box).buffer), data)
	})

	it('should return a box that writeStsz writes as the original bytes', function () {
		let count = 0

		for (const file of fixtureFiles()) {
			const originals = rawBytes(file, 'stsz')

			for (const [index, box] of filterBoxes(file, 'stsz', {
				readers: { stsz: readStsz },
			}).entries()) {
				const original = originals[index]
				const written = writeWith(writeStsz, box)

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

	it('should have no sampleCount when the box has entry sizes', function () {
		const [box] = readIsoBoxes(boxBytes('stsz', [0, 1], [0, 3], [0, 4], [1, 4], [512, 4]), {
			readers: { stsz: readStsz },
		})

		assert.ok(isIsoBoxType('stsz', box))
		assert.ok(!('sampleCount' in box))
		assert.deepStrictEqual(box.entrySize, [512])
	})
})
