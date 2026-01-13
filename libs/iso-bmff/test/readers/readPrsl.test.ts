import { assert, describe, filterBoxes, it, readMeta, readPrsl } from '../util/box.ts'

describe('readPrsl', function () {
	it('should correctly parse the readPrsl box from sample data', function () {
		const boxes = filterBoxes<any>('SRMP_AC4.mp4', 'prsl', { readers: { prsl: readPrsl, meta: readMeta } })

		assert.strictEqual(boxes.length, 6)
		assert.strictEqual(boxes[1].type, 'prsl')
		assert.strictEqual(boxes[1].groupId, 234)
		assert.strictEqual(boxes[1].numEntitiesInGroup, 1)
		assert.strictEqual(boxes[1].entities[0].entityId, 1)
		assert.strictEqual(boxes[1].preselectionTag, '1')
		assert.strictEqual(boxes[1].selectionPriority, 1)
	})
})
