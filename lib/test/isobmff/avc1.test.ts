import { assert, avc1, describe, filterBoxes, it, stsd } from './util/box';

describe('avc1 box', function () {
	it('should correctly parse the box', function () {
		const container = filterBoxes<any>('240fps_go_pro_hero_4.mp4', [stsd, avc1]);
		const box = container[0].entries[0];

		assert.strictEqual(box.type, 'avc1');
		assert.strictEqual(box.size, 184);

		assert.deepStrictEqual(box.reserved1, [0, 0, 0, 0, 0, 0]);
		assert.strictEqual(box.dataReferenceIndex, 1);
		assert.strictEqual(box.preDefined1, 0);
		assert.strictEqual(box.reserved2, 0);
		assert.deepStrictEqual(box.preDefined2, [0, 0, 0]);
		assert.strictEqual(box.width, 1280);
		assert.strictEqual(box.height, 720);
		assert.strictEqual(box.horizresolution, 72);
		assert.strictEqual(box.vertresolution, 72);
		assert.strictEqual(box.reserved3, 0);
		assert.strictEqual(box.frameCount, 1);
		assert.deepStrictEqual(box.compressorName, [0x11, 0x47, 0x6F, 0x50, 0x72, 0x6F, 0x20, 0x41,
			0x56, 0x43, 0x20, 0x65, 0x6E, 0x63, 0x6F, 0x64,
			0x65, 0x72, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]); // length + 'GoPro AVC encoder'
		assert.strictEqual(box.depth, 24);
		assert.strictEqual(box.preDefined3, -1);
		assert.strictEqual(box.config.byteLength, 98);
	});
});
