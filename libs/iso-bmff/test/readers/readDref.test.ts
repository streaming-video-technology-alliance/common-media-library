import {
	assert,
	defaultReaderConfig,
	defaultWriterConfig,
	describe,
	filterBoxes,
	it,
	readDref,
	readIsoBoxes,
	readUrl,
	writeIsoBox,
	type DataReferenceBox,
} from '../util/box.ts'
import { boxBytes } from '../util/wideBoxes.ts'

describe('readDref', function () {
	it('should correctly parse the box from sample data', function () {
		const boxes = filterBoxes('captions.mp4', 'dref', {
			readers: { dref: readDref, 'url ': readUrl },
		})
		assert.strictEqual(boxes.length, 1)

		const box = boxes[0]
		assert.strictEqual(box.type, 'dref')
		assert.strictEqual(box.boxes.length, 1)

		const entry = box.boxes[0]
		assert.strictEqual(entry.type, 'url ')
		assert.strictEqual(entry.version, 0)
		assert.strictEqual(entry.flags, 1)
		assert.strictEqual(entry.location, '')
	})

	it('should read no entries for an entry_count of 0', function () {
		const url = boxBytes('url ', [0, 1], [1, 3])
		const bytes = boxBytes('dref', [0, 4], [0, 4], url)

		const [box] = readIsoBoxes(bytes, defaultReaderConfig()) as DataReferenceBox[]

		assert.strictEqual(box.entryCount, 0)
		assert.deepStrictEqual(box.boxes, [])
	})

	it('should write an entry_count of 0 after a read', function () {
		const url = boxBytes('url ', [0, 1], [1, 3])
		const bytes = boxBytes('dref', [0, 4], [0, 4], url)

		const [box] = readIsoBoxes(bytes, defaultReaderConfig()) as DataReferenceBox[]
		const written = writeIsoBox(box, defaultWriterConfig())

		assert.deepStrictEqual(written, boxBytes('dref', [0, 4], [0, 4]))
	})
})
