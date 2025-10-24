import { assert, describe, filterBoxes, it, meta, prsl } from './util/box.ts'

describe('prsl box', function () {
	it('should correctly parse the prsl box from sample data', function () {
		const boxes = filterBoxes<any>('SRMP_AC4.mp4', [prsl, meta])

		assert.strictEqual(boxes.length, 6)
		assert.strictEqual(boxes[1].type, 'prsl')
		assert.strictEqual(boxes[1].groupId, 234)
		assert.strictEqual(boxes[1].numEntitiesInGroup, 1)
		assert.strictEqual(boxes[1].entities[0].entityId, 1)
		assert.strictEqual(boxes[1].preselectionTag, '1')
		assert.strictEqual(boxes[1].selectionPriority, 1)
	})
})
