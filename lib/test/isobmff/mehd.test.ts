import { mehd } from '@svta/common-media-library';
import { assert, describe, findBox, it } from './util/box';

describe('mehd box', function () {
	it('should correctly parse the box', function () {
		const box = findBox('test_frag.mp4', mehd);

		assert.strictEqual(box.type, 'mehd');
		assert.strictEqual(box.size, 16);
		assert.strictEqual(box.value.fragmentDuration, 2047);
	});
});
