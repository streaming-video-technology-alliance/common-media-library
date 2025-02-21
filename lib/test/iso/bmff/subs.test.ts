import { assert, describe, filterBoxes, it, subs } from './util/box';

describe('subs box', function () {
	it('should correctly parse the box from sample data', function () {
		const boxes = filterBoxes('subsample.m4s', subs);

		assert.strictEqual(boxes.length, 1);
		assert.strictEqual(boxes[0].type, 'subs');

		const { entries } = boxes[0];
		assert.strictEqual(entries.length, 1);

		const entry = entries[0];
		assert.strictEqual(entry.sampleDelta, 1);
		assert.strictEqual(entry.subsampleCount, 3);
		assert.strictEqual(entry.subsamples.length, 3);

		const subsample = entry.subsamples[0];
		assert.strictEqual(subsample.subsampleSize, 5);
		assert.strictEqual(subsample.subsamplePriority, 0);
		assert.strictEqual(subsample.discardable, 0);
		assert.strictEqual(subsample.codecSpecificParameters, 0);
	});
});
