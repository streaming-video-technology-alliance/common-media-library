import { assert, describe, filterBoxes, it, prft } from './util/box';

describe('prft box', function () {
	it('should correctly parse the box from sample data', function () {
		const boxes = filterBoxes('dash-chunks-prft.m4s', prft);
		assert.strictEqual(boxes.length, 60);
		assert.strictEqual(boxes[0].type, 'prft');
		assert.strictEqual(boxes[0].value.referenceTrackId, 1);
		assert.strictEqual(boxes[0].value.ntpTimestampSec, 3879495203);
		assert.strictEqual(boxes[0].value.ntpTimestampFrac, 197568495);
		assert.strictEqual(boxes[0].value.mediaTime, 1355974620);
	});
});
