import { assert, describe, filterBoxes, it, mp4a, stsd } from './util/box.ts'

describe('mp4a box', function () {
	it('should correctly parse the box', function () {
		const container = filterBoxes<any>('240fps_go_pro_hero_4.mp4', [stsd, mp4a])
		const box = container[1].entries[0]

		assert.strictEqual(box.type, 'mp4a')
		assert.strictEqual(box.size, 86)

		assert.deepStrictEqual(box.reserved1, [0, 0, 0, 0, 0, 0])
		assert.strictEqual(box.dataReferenceIndex, 1)
		assert.deepStrictEqual(box.reserved2, [0, 0])
		assert.strictEqual(box.channelcount, 2)
		assert.strictEqual(box.samplesize, 16)
		//assert.strictEqual(box.pre_defined, 0); // not conformed value in the file, not tested
		assert.strictEqual(box.reserved3, 0)
		assert.strictEqual(box.samplerate, 48000)
		assert.strictEqual(box.esds.byteLength, 50)
	})
})
