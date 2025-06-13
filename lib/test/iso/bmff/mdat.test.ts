import { mdat, type MediaDataBox } from '@svta/common-media-library';
import { assert, describe, it, parseBox } from './util/box.ts';

describe('mdat box', function () {
	it('should correctly parse the mdat box', function () {
		const box = parseBox('captions.mp4', mdat, 2) as MediaDataBox;

		assert.strictEqual(box.type, 'mdat');
		assert.strictEqual(box.size, 21530);
		assert.strictEqual(box.data.byteLength, 21522);
	});
});
