import { assert, avc1, describe, filterBoxes, it, stsd } from './util/box';

describe('avc1 box', function () {
	it('should correctly parse the box', function () {
		const container = filterBoxes<any>('240fps_go_pro_hero_4.mp4', [stsd, avc1]);
		const box = container[0].value.entries[0];

		assert.strictEqual(box.type, 'avc1');
		assert.strictEqual(box.size, 184);

		const { value } = box;
		assert.deepStrictEqual(value.reserved1, [0, 0, 0, 0, 0, 0]);
		assert.strictEqual(value.dataReferenceIndex, 1);
		assert.strictEqual(value.preDefined1, 0);
		assert.strictEqual(value.reserved2, 0);
		assert.deepStrictEqual(value.preDefined2, [0, 0, 0]);
		assert.strictEqual(value.width, 1280);
		assert.strictEqual(value.height, 720);
		assert.strictEqual(value.horizresolution, 72);
		assert.strictEqual(value.vertresolution, 72);
		assert.strictEqual(value.reserved3, 0);
		assert.strictEqual(value.frameCount, 1);
		assert.deepStrictEqual(value.compressorName, [0x11, 0x47, 0x6F, 0x50, 0x72, 0x6F, 0x20, 0x41,
			0x56, 0x43, 0x20, 0x65, 0x6E, 0x63, 0x6F, 0x64,
			0x65, 0x72, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]); // length + 'GoPro AVC encoder'
		assert.strictEqual(value.depth, 24);
		assert.strictEqual(value.preDefined3, -1);
		assert.strictEqual(value.config.byteLength, 98);
	});
});
