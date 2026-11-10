import { assert, describe, findBox, it, readElst, readIsoBoxes } from '../util/box.ts'
import { ELST_V1 } from '../util/ELST_V1.ts'

describe('readElst', function () {
	it('should correctly parse the box', function () {
		const box = findBox('editlist.mp4', 'elst', { readers: { elst: readElst } })

		assert.strictEqual(box.size, 28)
		assert.strictEqual(box.entryCount, 1)
		assert.strictEqual(box.entries[0].segmentDuration, 1000)
		assert.strictEqual(box.entries[0].mediaRateInteger, 1)
		assert.strictEqual(box.entries[0].mediaRateFraction, 0)
		assert.strictEqual(box.entries[0].mediaTime, 1024)
	})

	it('should read the 64-bit mediaTime of a version 1 box', function () {
		const [box] = readIsoBoxes(ELST_V1, { readers: { elst: readElst } })

		assert.ok(box)
		assert.strictEqual(box.type, 'elst')
		assert.strictEqual(box.version, 1)
		assert.strictEqual(box.entryCount, 4)
		assert.strictEqual(box.entries[0].segmentDuration, 1000)
		assert.strictEqual(box.entries[0].mediaTime, -1)
		assert.strictEqual(box.entries[1].mediaTime, 2147483648)
		assert.strictEqual(box.entries[2].mediaTime, -2)
		assert.strictEqual(box.entries[3].mediaTime, 1024)
	})
})
