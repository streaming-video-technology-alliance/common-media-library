import { readFile } from 'fs/promises'
import { assert, createAudioSampleEntryReader, createVisualSampleEntryReader, describe, findIsoBox, it, readIsoBoxes, readStsd, writeIsoBoxes, writeStsd, writeVisualSampleEntryBox, type IsoBoxReadView } from './util/box.ts'

describe('API', function () {
	it('should handle advanced use cases', async () => {
		const isoFile = await readFile('test/fixtures/hvc1_init.mp4')
		const boxes = readIsoBoxes(new Uint8Array(isoFile), {
			readers: {
				stsd: readStsd,
				test: (view: IsoBoxReadView) => ({ type: 'test' as const, value: view.readUint(4) }),
				hvc1: createVisualSampleEntryReader('hvc1'),
				'ac-3': createAudioSampleEntryReader('ac-3'),
			},
		})

		const stsd = findIsoBox(boxes, box => box.type === 'stsd')
		assert.ok(stsd)
		assert.strictEqual(stsd.type, 'stsd')
		assert.strictEqual(stsd.entries.length, 1)

		const entry = stsd.entries[0]
		assert.ok(entry)
		assert.strictEqual(entry.type, 'hvc1')
		assert.strictEqual(entry.boxes.length, 2)

		const stream = writeIsoBoxes(boxes, {
			writers: {
				hvc1: writeVisualSampleEntryBox,
				stsd: writeStsd,
			}
		})

		const size = stream.reduce((acc, chunk) => acc + chunk.byteLength, 0)
		const result = new Uint8Array(size)
		let offset = 0

		for (const box of stream) {
			result.set(box, offset)
			offset += box.byteLength
		}

		assert.strictEqual(Buffer.compare(isoFile, result), 0)
	})
})
