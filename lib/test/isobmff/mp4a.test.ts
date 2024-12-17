import { assert, describe, filterBoxes, it, mp4a, stsd } from './util/box';

describe('mp4a box', function () {
	it('should correctly parse the box', function () {
		const container = filterBoxes<any>('240fps_go_pro_hero_4.mp4', [stsd, mp4a]);
		const box = container[1].value.entries[0];

		assert.strictEqual(box.type, 'mp4a');
		assert.strictEqual(box.size, 86);

		const { value } = box;
		assert.deepStrictEqual(value.reserved1, [0, 0, 0, 0, 0, 0]);
		assert.strictEqual(value.dataReferenceIndex, 1);
		assert.deepStrictEqual(value.reserved2, [0, 0]);
		assert.strictEqual(value.channelcount, 2);
		assert.strictEqual(value.samplesize, 16);
		//assert.strictEqual(box.pre_defined, 0); // not conformed value in the file, not tested
		assert.strictEqual(value.reserved3, 0);
		assert.strictEqual(value.samplerate, 48000);
		assert.strictEqual(value.esds.byteLength, 50);
	});
});
