import { assert, describe, filterBoxes, it, readTrex } from '../util/box.ts'

describe('readTrex', function () {
	it('should correctly parse the box', function () {
		const boxes = filterBoxes('test_frag.mp4', 'trex', { readers: { trex: readTrex } })

		assert.strictEqual(boxes.length, 2)

		assert.strictEqual(boxes[0].type, 'trex')
		assert.strictEqual(boxes[0].size, 32)
		assert.strictEqual(boxes[0].trackId, 1)
		assert.strictEqual(boxes[0].defaultSampleDescriptionIndex, 1)
		assert.strictEqual(boxes[0].defaultSampleDuration, 0)
		assert.strictEqual(boxes[0].defaultSampleSize, 0)
		assert.strictEqual(boxes[0].defaultSampleFlags, 0)

		assert.strictEqual(boxes[1].type, 'trex')
		assert.strictEqual(boxes[1].size, 32)
		assert.strictEqual(boxes[1].trackId, 2)
		assert.strictEqual(boxes[1].defaultSampleDescriptionIndex, 1)
		assert.strictEqual(boxes[1].defaultSampleDuration, 0)
		assert.strictEqual(boxes[1].defaultSampleSize, 0)
		assert.strictEqual(boxes[1].defaultSampleFlags, 0)
	})
})
