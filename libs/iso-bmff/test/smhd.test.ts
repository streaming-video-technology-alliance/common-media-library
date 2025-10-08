import { assert, describe, filterBoxes, it, smhd } from './util/box.ts';

describe('smhd box', function () {
	it('should correctly parse the box from sample data', function () {
		const boxes = filterBoxes('240fps_go_pro_hero_4.mp4', smhd);
		assert.strictEqual(boxes.length, 1);
		assert.strictEqual(boxes[0].type, 'smhd');
		assert.strictEqual(boxes[0].balance, 0.0);
	});
});
