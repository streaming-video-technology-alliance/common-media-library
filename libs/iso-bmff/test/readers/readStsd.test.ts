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
	type SampleDescriptionBox,
} from '../util/box.ts'
import { typeOf } from '../util/typeOf.ts'
import { boxBytes } from '../util/wideBoxes.ts'

describe('readStsd', function () {
	it('should correctly parse the box', function () {
		const boxes = filterBoxes('240fps_go_pro_hero_4.mp4', 'stsd', { readers: { stsd: readStsd } })

		assert.strictEqual(boxes.length, 3)
		// The read has no reader for the entries, so each entry is a raw box.
		assert.deepStrictEqual(
			boxes.map(box => typeOf(box.boxes[0])),
			['avc1', 'mp4a', 'fdsc'],
		)
	})

	it('should read no entries for an entry_count of 0', function () {
		const avc1 = boxBytes('avc1', new Uint8Array(78))
		const bytes = boxBytes('stsd', [0, 4], [0, 4], avc1)

		const [box] = readIsoBoxes(bytes, createDefaultReaderConfig()) as SampleDescriptionBox[]

		assert.deepStrictEqual(box.boxes, [])
	})

	it('should write an entry_count of 0 after a read', function () {
		const avc1 = boxBytes('avc1', new Uint8Array(78))
		const bytes = boxBytes('stsd', [0, 4], [0, 4], avc1)

		const [box] = readIsoBoxes(bytes, createDefaultReaderConfig()) as SampleDescriptionBox[]
		const written = writeIsoBox(box, createDefaultWriterConfig())

		assert.deepStrictEqual(written, boxBytes('stsd', [0, 4], [0, 4]))
	})

	it('should throw a RangeError for fewer complete entries than entry_count', function () {
		const avc1 = boxBytes('avc1', new Uint8Array(78))
		const bytes = boxBytes('stsd', [0, 4], [2, 4], avc1)

		assert.throws(() => readIsoBoxes(bytes, createDefaultReaderConfig()), {
			name: 'RangeError',
			message: 'The stsd box has an entry_count of 2, and the number of complete child boxes is 1',
		})
	})
})
