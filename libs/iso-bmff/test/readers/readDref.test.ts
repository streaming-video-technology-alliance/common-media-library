import { assert, describe, filterBoxes, it, readDref, readUrl } from '../util/box.ts'

describe('readDref', function () {
	it('should correctly parse the box from sample data', function () {
		const boxes = filterBoxes('captions.mp4', 'dref', { readers: { dref: readDref, 'url ': readUrl } })
		assert.strictEqual(boxes.length, 1)

		const box = boxes[0]
		assert.strictEqual(box.type, 'dref')
		assert.strictEqual(box.entries.length, 1)

		const entry = box.entries[0]
		assert.strictEqual(entry.type, 'url ')
		assert.strictEqual(entry.version, 0)
		assert.strictEqual(entry.flags, 1)
		assert.strictEqual(entry.location, '')
	})
})
