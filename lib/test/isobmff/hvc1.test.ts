import { assert, describe, filterBoxes, hvc1, it, stsd } from './util/box';

describe('hvc1 box', function () {
	it('should correctly parse the box', function () {
		const container = filterBoxes<any>('hvc1_init.mp4', [stsd, hvc1]);
		const box = container[0].value.entries[0];

		assert.strictEqual(box.type, 'hvc1');
		assert.strictEqual(box.size, 137);

		const { value } = box;
		assert.deepStrictEqual(value.reserved1, [0, 0, 0, 0, 0, 0]);
		assert.strictEqual(value.dataReferenceIndex, 1);
		assert.strictEqual(value.preDefined1, 0);
		assert.strictEqual(value.reserved2, 0);
		assert.deepStrictEqual(value.preDefined2, [0, 0, 0]);
		assert.strictEqual(value.width, 192);
		assert.strictEqual(value.height, 108);
		assert.strictEqual(value.horizresolution, 72);
		assert.strictEqual(value.vertresolution, 72);
		assert.strictEqual(value.reserved3, 0);
		assert.strictEqual(value.frameCount, 1);
		assert.deepStrictEqual(value.compressorName, [0x0B, 0x48, 0x45, 0x56, 0x43, 0x20, 0x43, 0x6F,
			0x64, 0x69, 0x6E, 0x67, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]); // length + 'HEVC Coding'
		assert.strictEqual(value.depth, 24);
		assert.strictEqual(value.preDefined3, -1);
		assert.strictEqual(value.config.byteLength, 51);
	});
});
