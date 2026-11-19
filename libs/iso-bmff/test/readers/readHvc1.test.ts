import { assert, describe, filterBoxes, isIsoBoxType, it, readHvc1, readStsd } from '../util/box.ts'

describe('readHvc1', function () {
	it('should correctly parse the box', function () {
		const container = filterBoxes('hvc1_init.mp4', 'stsd', {
			readers: { stsd: readStsd, hvc1: readHvc1 },
		})

		assert.strictEqual(container[0].type, 'stsd')
		const box = container[0].boxes[0]

		assert.ok(isIsoBoxType('hvc1', box))

		assert.strictEqual(box.dataReferenceIndex, 1)
		assert.strictEqual(box.preDefined1, 0)
		assert.deepStrictEqual(box.preDefined2, [0, 0, 0])
		assert.strictEqual(box.width, 192)
		assert.strictEqual(box.height, 108)
		assert.strictEqual(box.horizResolution, 72)
		assert.strictEqual(box.vertResolution, 72)
		assert.strictEqual(box.frameCount, 1)
		assert.deepStrictEqual(
			box.compressorName,
			[
				0x0b, 0x48, 0x45, 0x56, 0x43, 0x20, 0x43, 0x6f, 0x64, 0x69, 0x6e, 0x67, 0x00, 0x00, 0x00,
				0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
				0x00, 0x00,
			],
		) // length + 'HEVC Coding'
		assert.strictEqual(box.depth, 24)
		assert.strictEqual(box.preDefined3, -1)
		assert.strictEqual(box.boxes.length, 2)
	})
})
