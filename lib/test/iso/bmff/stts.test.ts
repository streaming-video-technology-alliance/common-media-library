import { assert, describe, filterBoxes, it, stts } from './util/box';

describe('stts box', function () {
	it('should correctly parse the box', function () {
		const boxes = filterBoxes('editlist.mp4', stts);
		const box = boxes[0];

		assert.strictEqual(boxes.length, 1);

		assert.strictEqual(box.type, 'stts');
		assert.strictEqual(box.entryCount, 2);
		assert.strictEqual(box.entries.length, 2);
		assert.strictEqual(box.entries[0].sampleCount, 47);
		assert.strictEqual(box.entries[0].sampleDelta, 1024);
		assert.strictEqual(box.entries[1].sampleCount, 1);
		assert.strictEqual(box.entries[1].sampleDelta, 896);
	});
});
