import {
	assert,
	createDefaultReaderConfig,
	createDefaultWriterConfig,
	describe,
	filterBoxes,
	it,
	readIsoBoxes,
	readStsd,
	writeIsoBox,
	type AudioSampleEntry,
	type SampleDescriptionBox,
	type VisualSampleEntry,
	type VisualSampleEntryType,
} from '../util/box.ts'
import { boxBytes } from '../util/wideBoxes.ts'

describe('readStsd', function () {
	it('should correctly parse the box', function () {
		const boxes = filterBoxes('240fps_go_pro_hero_4.mp4', 'stsd', { readers: { stsd: readStsd } })

		assert.strictEqual(boxes.length, 3)
		assert.strictEqual((boxes[0].boxes[0] as VisualSampleEntry<'avc1'>).type, 'avc1')
		assert.strictEqual((boxes[1].boxes[0] as AudioSampleEntry<'mp4a'>).type, 'mp4a')
		assert.strictEqual((boxes[2].boxes[0] as VisualSampleEntry<VisualSampleEntryType>).type, 'fdsc')
	})

	it('should read no entries for an entry_count of 0', function () {
		const avc1 = boxBytes('avc1', new Uint8Array(78))
		const bytes = boxBytes('stsd', [0, 4], [0, 4], avc1)

		const [box] = readIsoBoxes(bytes, createDefaultReaderConfig()) as SampleDescriptionBox[]

		assert.strictEqual(box.entryCount, 0)
		assert.deepStrictEqual(box.boxes, [])
	})

	it('should write an entry_count of 0 after a read', function () {
		const avc1 = boxBytes('avc1', new Uint8Array(78))
		const bytes = boxBytes('stsd', [0, 4], [0, 4], avc1)

		const [box] = readIsoBoxes(bytes, createDefaultReaderConfig()) as SampleDescriptionBox[]
		const written = writeIsoBox(box, createDefaultWriterConfig())

		assert.deepStrictEqual(written, boxBytes('stsd', [0, 4], [0, 4]))
	})
})
