import { assert, describe, it, parseBox, ssix } from './util/box';

describe('ssix box', function () {
	it('should correctly parse the box', function () {
		const box = parseBox('spliced_10000.m4v', ssix, 4);

		assert.strictEqual(box.type, 'ssix');
		assert.strictEqual(box.size, 8124);
		assert.strictEqual(box.value.subsegmentCount, 25);
		assert.strictEqual(box.value.subsegments.length, 25);

		// Test one of the subsegments
		assert.strictEqual(box.value.subsegments[0].rangesCount, 70);
		assert.strictEqual(box.value.subsegments[0].ranges[45].level, 2);
		assert.strictEqual(box.value.subsegments[0].ranges[45].rangeSize, 7312);
	});
});
