import { assert, describe, dref, filterBoxes, it, url } from './util/box.ts';

describe('dref box', function () {
	it('should correctly parse the box from sample data', function () {
		const boxes = filterBoxes<any>('captions.mp4', [dref, url]);
		assert.strictEqual(boxes.length, 1);

		const box = boxes[0];
		assert.strictEqual(box.type, 'dref');
		assert.strictEqual(box.entries.length, 1);

		const entry = box.entries[0];
		assert.strictEqual(entry.type, 'url ');
		assert.strictEqual(entry.version, 0);
		assert.strictEqual(entry.flags, 1);
		assert.strictEqual(entry.location, '');
	});
});
