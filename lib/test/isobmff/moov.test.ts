import { assert, describe, it, parseContainer } from './util/box';

describe('moov box', function () {
	it('should correctly parse the box', function () {
		const box = parseContainer('captions.mp4', 1);

		assert.strictEqual(box.type, 'moov');
		assert.strictEqual(box.size, 1028);
		assert.strictEqual(box.value.length, 2);
	});
});
