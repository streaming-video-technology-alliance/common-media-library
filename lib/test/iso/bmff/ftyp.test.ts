import { ftyp } from '@svta/common-media-library';
import { assert, describe, it, parseBox } from './util/box.ts';

describe('ftyp box', function () {
	it('should correctly parse the box', function () {
		const box = parseBox('captions.mp4', ftyp, 0);

		assert.strictEqual(box.type, 'ftyp');
		assert.strictEqual(box.size, 20);
		assert.strictEqual(box.majorBrand, 'isom');
		assert.strictEqual(box.minorVersion, 1);
		assert.deepStrictEqual(box.compatibleBrands, ['isom']);
	});
});
