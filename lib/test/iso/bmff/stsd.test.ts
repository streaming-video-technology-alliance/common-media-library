import { assert, describe, filterBoxes, it, stsd } from './util/box.ts';

describe('stsd box', function () {
	it('should correctly parse the box', function () {
		const boxes = filterBoxes('240fps_go_pro_hero_4.mp4', stsd);

		assert.strictEqual(boxes.length, 3);
		assert.strictEqual(boxes[0].entries[0].type, 'avc1');
		assert.strictEqual(boxes[1].entries[0].type, 'mp4a');
		assert.strictEqual(boxes[2].entries[0].type, 'fdsc');
	});
});
