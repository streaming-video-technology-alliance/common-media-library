import { assert, describe, filterBoxes, it, readCtts } from '../util/box.ts'

describe('readCtts', function () {
	it('should correctly parse the box', function () {
		const boxes = filterBoxes('time_to_sample.mp4', 'ctts', { readers: { ctts: readCtts } })
		const box = boxes[0]

		assert.strictEqual(boxes.length, 1)

		assert.strictEqual(box.type, 'ctts')

		assert.strictEqual(box.entryCount, 5)

		const { entries } = box
		assert.strictEqual(entries.length, 5)
		assert.strictEqual(entries[0].sampleCount, 1)
		assert.strictEqual(entries[0].sampleOffset, 1024)
		assert.strictEqual(entries[1].sampleCount, 1)
		assert.strictEqual(entries[1].sampleOffset, 2560)
		assert.strictEqual(entries[2].sampleCount, 1)
		assert.strictEqual(entries[2].sampleOffset, 1024)
		assert.strictEqual(entries[3].sampleCount, 1)
		assert.strictEqual(entries[3].sampleOffset, 0)
		assert.strictEqual(entries[4].sampleCount, 1)
		assert.strictEqual(entries[4].sampleOffset, 512)
	})
})
