import { assert, describe, readElst, findBox, it } from '../util/box.ts'

describe('readElst', function () {
	it('should correctly parse the box', function () {
		const box = findBox('editlist.mp4', readElst)

		assert.strictEqual(box.size, 28)
		assert.strictEqual(box.entryCount, 1)
		assert.strictEqual(box.entries[0].segmentDuration, 1000)
		assert.strictEqual(box.entries[0].mediaRateInteger, 1)
		assert.strictEqual(box.entries[0].mediaRateFraction, 0)
		assert.strictEqual(box.entries[0].mediaTime, 1024)
	})
})
