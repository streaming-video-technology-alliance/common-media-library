import {
	assert,
	createDefaultReaderConfig,
	createDefaultWriterConfig,
	describe,
	filterBoxes,
	isIsoBoxType,
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
		assert.ok(isIsoBoxType('url ', entry))
		assert.strictEqual(entry.version, 0)
		assert.strictEqual(entry.flags, 1)
		assert.ok('location' in entry)
		assert.strictEqual(entry.location, undefined)
	})

	it('should read no entries for an entry_count of 0', function () {
		const url = boxBytes('url ', [0, 1], [1, 3])
		const bytes = boxBytes('dref', [0, 4], [0, 4], url)

		const [box] = readIsoBoxes(bytes, createDefaultReaderConfig()) as DataReferenceBox[]

		assert.deepStrictEqual(box.boxes, [])
	})

	it('should write an entry_count of 0 after a read', function () {
		const url = boxBytes('url ', [0, 1], [1, 3])
		const bytes = boxBytes('dref', [0, 4], [0, 4], url)

		const [box] = readIsoBoxes(bytes, createDefaultReaderConfig()) as DataReferenceBox[]
		const written = writeIsoBox(box, createDefaultWriterConfig())

		assert.deepStrictEqual(written, boxBytes('dref', [0, 4], [0, 4]))
	})

	it('should throw a RangeError for fewer complete entries than entry_count', function () {
		const url = boxBytes('url ', [0, 1], [1, 3])
		const bytes = boxBytes('dref', [0, 4], [3, 4], url, url)

		assert.throws(() => readIsoBoxes(bytes, createDefaultReaderConfig()), {
			name: 'RangeError',
			message: 'The dref box has an entry_count of 3, and the number of complete child boxes is 2',
		})
	})
})
