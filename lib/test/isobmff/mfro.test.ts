import { mfro } from '@svta/common-media-library';
import { assert, describe, findBox, it } from './util/box';

describe('mfro box', function () {
	it('should correctly parse the box', function () {
		const box = findBox('test_frag.mp4', mfro);

		assert.strictEqual(box.type, 'mfro');
		assert.strictEqual(box.size, 16);
		assert.strictEqual(box.value.size, 105);
	});
});
