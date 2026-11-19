import {
	assert,
	describe,
	filterBoxes,
	isIsoBoxType,
	it,
	readAvc1,
	readIsoBoxes,
	readStsd,
} from '../util/box.ts'

describe('readAvc1', function () {
	it('should correctly parse the box', function () {
		const container = filterBoxes('240fps_go_pro_hero_4.mp4', 'stsd', {
			readers: { stsd: readStsd, avc1: readAvc1 },
		})

		assert.ok(isIsoBoxType('stsd', container[0]))

		const box = container[0].boxes[0]
		assert.ok(isIsoBoxType('avc1', box))

		assert.strictEqual(box.dataReferenceIndex, 1)
		assert.strictEqual(box.preDefined1, 0)
		assert.deepStrictEqual(box.preDefined2, [0, 0, 0])
		assert.strictEqual(box.width, 1280)
		assert.strictEqual(box.height, 720)
		assert.strictEqual(box.horizResolution, 72)
		assert.strictEqual(box.vertResolution, 72)
		assert.strictEqual(box.frameCount, 1)
		assert.deepStrictEqual(
			box.compressorName,
			[
				0x11, 0x47, 0x6f, 0x50, 0x72, 0x6f, 0x20, 0x41, 0x56, 0x43, 0x20, 0x65, 0x6e, 0x63, 0x6f,
				0x64, 0x65, 0x72, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
				0x00, 0x00,
			],
		) // length + 'GoPro AVC encoder'
		assert.strictEqual(box.depth, 24)
		assert.strictEqual(box.preDefined3, -1)
		assert.strictEqual(box.boxes.length, 2)
	})

	it('should read the fraction of the resolution', function () {
		const bytes = new Uint8Array(86)
		const view = new DataView(bytes.buffer)

		view.setUint32(0, bytes.length)
		view.setUint32(4, 0x61766331) // 'avc1'
		view.setUint32(36, 0x00488000) // horizResolution
		view.setUint32(40, 0x012c4000) // vertResolution

		const [box] = readIsoBoxes(bytes, { readers: { avc1: readAvc1 } })

		assert.ok(box)
		assert.ok(isIsoBoxType('avc1', box))
		assert.strictEqual(box.horizResolution, 72.5)
		assert.strictEqual(box.vertResolution, 300.25)
	})
})
