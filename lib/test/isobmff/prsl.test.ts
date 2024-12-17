import { assert, describe, filterBoxes, it, meta, prsl } from './util/box';

describe('prsl box', function () {
	it('should correctly parse the prsl box from sample data', function () {
		const boxes = filterBoxes<any>('SRMP_AC4.mp4', [prsl, meta]);

		assert.strictEqual(boxes.length, 6);
		assert.strictEqual(boxes[1].type, 'prsl');
		assert.strictEqual(boxes[1].value.groupId, 234);
		assert.strictEqual(boxes[1].value.numEntitiesInGroup, 1);
		assert.strictEqual(boxes[1].value.entities[0].entityId, 1);
		assert.strictEqual(boxes[1].value.preselectionTag, '1');
		assert.strictEqual(boxes[1].value.selectionPriority, 1);
	});
});
