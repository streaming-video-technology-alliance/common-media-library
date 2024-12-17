import { assert, describe, filterBoxes, it, trex } from './util/box';

describe('trex box', function () {
	it('should correctly parse the box', function () {
		const boxes = filterBoxes('test_frag.mp4', trex);

		assert.strictEqual(boxes.length, 2);

		assert.strictEqual(boxes[0].type, 'trex');
		assert.strictEqual(boxes[0].size, 32);
		assert.strictEqual(boxes[0].value.trackId, 1);
		assert.strictEqual(boxes[0].value.defaultSampleDescriptionIndex, 1);
		assert.strictEqual(boxes[0].value.defaultSampleDuration, 0);
		assert.strictEqual(boxes[0].value.defaultSampleSize, 0);
		assert.strictEqual(boxes[0].value.defaultSampleFlags, 0);

		assert.strictEqual(boxes[1].type, 'trex');
		assert.strictEqual(boxes[1].size, 32);
		assert.strictEqual(boxes[1].value.trackId, 2);
		assert.strictEqual(boxes[1].value.defaultSampleDescriptionIndex, 1);
		assert.strictEqual(boxes[1].value.defaultSampleDuration, 0);
		assert.strictEqual(boxes[1].value.defaultSampleSize, 0);
		assert.strictEqual(boxes[1].value.defaultSampleFlags, 0);
	});
});
