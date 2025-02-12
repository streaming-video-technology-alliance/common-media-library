import { assert, describe, filterBoxesByType, it } from './util/box';
import { load } from './util/load';

describe('filter boxes by type', function () {
	it('filter boxes by type', function () {
		const buffer = load('./captions_fragmented.mp4');
		const boxes = filterBoxesByType('mdat', buffer);

		assert.strictEqual(boxes.length, 158);
		assert.strictEqual(boxes.every(box => box.type === 'mdat'), true);
	});
});
