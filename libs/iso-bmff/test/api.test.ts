import { readFile } from 'fs/promises'
import {
	assert,
	createAudioSampleEntryReader,
	createVisualSampleEntryReader,
	describe,
	filterIsoBoxes,
	findIsoBox,
	isIsoBoxType,
	beginIsoBox,
	endIsoBox,
	writeUint32,
	type IsoBoxWriteCursor,
	it,
	readIsoBoxes,
	readUint32,
	readStsd,
	writeIsoBoxes,
	writeStsd,
	writeVisualSampleEntry,
	type IsoBoxReadCursor,
} from './util/box.ts'

describe('API', function () {
	it('should handle advanced use cases', async () => {
		const isoFile = await readFile(new URL('./fixtures/hvc1_init.mp4', import.meta.url))
		const boxes = readIsoBoxes(isoFile, {
			readers: {
				stsd: readStsd,
				test: (cursor: IsoBoxReadCursor) => ({ type: 'test' as const, value: readUint32(cursor) }),
				hvc1: createVisualSampleEntryReader('hvc1'),
				'ac-3': createAudioSampleEntryReader('ac-3'),
			},
		})

		const moov = filterIsoBoxes(boxes, box => box.type === 'moov')
		assert.ok(moov[0])
		assert.strictEqual(moov[0].type, 'moov')

		const stsd = findIsoBox(boxes, box => box.type === 'stsd')
		assert.ok(stsd)
		assert.ok(isIsoBoxType('stsd', stsd))
		assert.strictEqual(stsd.boxes.length, 1)

		const entry = stsd.boxes[0]
		assert.ok(entry)
		assert.ok(isIsoBoxType('hvc1', entry))
		assert.strictEqual(entry.boxes.length, 2)

		const stream = writeIsoBoxes(boxes, {
			writers: {
				hvc1: writeVisualSampleEntry,
				dvh1: writeVisualSampleEntry,
				test: (cursor: IsoBoxWriteCursor, box: { type: string; value: number }) => {
					const start = beginIsoBox(cursor, box.type)
					writeUint32(cursor, box.value)
					endIsoBox(cursor, start)
				},
				stsd: writeStsd,
			},
		})

		assert.strictEqual(Buffer.compare(isoFile, stream), 0)
	})
})
