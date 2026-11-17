import {
	assert,
	defaultReaderConfig,
	defaultWriterConfig,
	describe,
	filterBoxes,
	it,
	readIsoBoxes,
	readStsd,
	writeIsoBox,
	type AudioSampleEntryBox,
	type SampleDescriptionBox,
	type VisualSampleEntryBox,
	type VisualSampleEntryType,
} from '../util/box.ts'
import { boxBytes } from '../util/wideBoxes.ts'

describe('readStsd', function () {
	it('should correctly parse the box', function () {
		const boxes = filterBoxes('240fps_go_pro_hero_4.mp4', 'stsd', { readers: { stsd: readStsd } })

		assert.strictEqual(boxes.length, 3)
		assert.strictEqual((boxes[0].entries[0] as VisualSampleEntryBox<'avc1'>).type, 'avc1')
		assert.strictEqual((boxes[1].entries[0] as AudioSampleEntryBox<'mp4a'>).type, 'mp4a')
		assert.strictEqual(
			(boxes[2].entries[0] as VisualSampleEntryBox<VisualSampleEntryType>).type,
			'fdsc',
		)
	})

	it('should read no entries for an entry_count of 0', function () {
		const avc1 = boxBytes('avc1', new Uint8Array(78))
		const bytes = boxBytes('stsd', [0, 4], [0, 4], avc1)

		const [box] = readIsoBoxes(bytes, defaultReaderConfig()) as SampleDescriptionBox[]

		assert.strictEqual(box.entryCount, 0)
		assert.deepStrictEqual(box.entries, [])
	})

	it('should write an entry_count of 0 after a read', function () {
		const avc1 = boxBytes('avc1', new Uint8Array(78))
		const bytes = boxBytes('stsd', [0, 4], [0, 4], avc1)

		const [box] = readIsoBoxes(bytes, defaultReaderConfig()) as SampleDescriptionBox[]
		const written = writeIsoBox(box, defaultWriterConfig())

		assert.deepStrictEqual(written, boxBytes('stsd', [0, 4], [0, 4]))
	})
})
