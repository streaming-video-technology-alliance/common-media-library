import { assert, describe, it, parseContainer, type MovieBox } from './util/box.ts';

describe('moov box', function () {
	it('should correctly parse the box', function () {
		const box = parseContainer('captions.mp4', -3) as MovieBox;

		assert.ok(box);
		assert.strictEqual(box.type, 'moov');
		assert.strictEqual(box.size, 1028);
		assert.strictEqual(box.boxes.length, 2);
	});
});
