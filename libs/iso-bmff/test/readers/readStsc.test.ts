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
	readStsc,
	writeStsc,
} from '../util/box.ts'
import { fixtureFiles } from '../util/fixtureFiles.ts'

describe('readStsc', function () {
	it('should provide an example', async function () {
		// #region example
		const isoFile = await readFile(new URL('../fixtures/captions.mp4', import.meta.url))
		const boxes = readIsoBoxes(isoFile, {
			readers: {
				stsc: readStsc,
			},
		})

		const stsc = findIsoBox(boxes, box => isIsoBoxType('stsc', box))

		assert.ok(stsc)
		assert.ok(isIsoBoxType('stsc', stsc))
		assert.strictEqual(stsc.entryCount, 3)
		assert.deepStrictEqual(stsc.entries[0], {
			firstChunk: 1,
			samplesPerChunk: 2,
			sampleDescriptionIndex: 1,
		})
		// #endregion example
	})

	it('should correctly parse the box', function () {
		const boxes = filterBoxes('time_to_sample.mp4', 'stsc', { readers: { stsc: readStsc } })

		assert.strictEqual(boxes.length, 2)

		assert.ok(isIsoBoxType('stsc', boxes[0]))
		assert.strictEqual(boxes[0].version, 0)
		assert.strictEqual(boxes[0].flags, 0)
		assert.strictEqual(boxes[0].entryCount, 2)
		assert.deepStrictEqual(boxes[0].entries, [
			{ firstChunk: 1, samplesPerChunk: 2, sampleDescriptionIndex: 1 },
			{ firstChunk: 2, samplesPerChunk: 1, sampleDescriptionIndex: 1 },
		])

		assert.ok(isIsoBoxType('stsc', boxes[1]))
		assert.strictEqual(boxes[1].entryCount, 3)
		assert.deepStrictEqual(boxes[1].entries, [
			{ firstChunk: 1, samplesPerChunk: 1, sampleDescriptionIndex: 1 },
			{ firstChunk: 2, samplesPerChunk: 2, sampleDescriptionIndex: 1 },
			{ firstChunk: 4, samplesPerChunk: 5, sampleDescriptionIndex: 1 },
		])
	})

	it('should parse a box without entries', function () {
		const boxes = filterBoxes('captions_fragmented.mp4', 'stsc', { readers: { stsc: readStsc } })
		const box = boxes[0]

		assert.strictEqual(boxes.length, 1)

		assert.ok(isIsoBoxType('stsc', box))
		assert.strictEqual(box.entryCount, 0)
		assert.deepStrictEqual(box.entries, [])
	})

	it('should return a box that writeStsc writes as the original bytes', function () {
		let count = 0

		for (const file of fixtureFiles()) {
			const originals = rawBytes(file, 'stsc')

			for (const [index, box] of filterBoxes(file, 'stsc', {
				readers: { stsc: readStsc },
			}).entries()) {
				const original = originals[index]
				const written = writeWith(writeStsc, box)

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
