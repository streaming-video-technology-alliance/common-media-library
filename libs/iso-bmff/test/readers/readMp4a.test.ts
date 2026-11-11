import {
	assert,
	describe,
	filterBoxes,
	it,
	readIsoBoxes,
	readMp4a,
	readStsd,
	type IsoTypedParsedBox,
} from '../util/box.ts'

describe('readMp4a', function () {
	it('should correctly parse the box', function () {
		const container = filterBoxes('240fps_go_pro_hero_4.mp4', 'stsd', {
			readers: { stsd: readStsd, mp4a: readMp4a },
		})
		const box = container[1].entries[0] as IsoTypedParsedBox<'mp4a'>

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
		assert.strictEqual(box.boxes.length, 1)
	})

	it('should read the fraction of the sample rate', function () {
		const bytes = new Uint8Array(36)
		const view = new DataView(bytes.buffer)

		view.setUint32(0, bytes.length)
		view.setUint32(4, 0x6d703461) // 'mp4a'
		view.setUint32(32, 0xac448000) // samplerate

		const [box] = readIsoBoxes(bytes, { readers: { mp4a: readMp4a } })

		assert.ok(box)
		assert.strictEqual(box.type, 'mp4a')
		assert.strictEqual(box.samplerate, 44100.5)
	})
})
