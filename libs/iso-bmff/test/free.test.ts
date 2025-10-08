import { assert, describe, free, it, parseBox } from './util/box.ts';

describe('free box', () => {
	it('should correctly parse the box', () => {
		const box = parseBox('captions.mp4', free, 3);

		assert.strictEqual(box.type, 'free');
		assert.strictEqual(box.size, 59);
		assert.strictEqual(box.data.length, 51);
	});
});
