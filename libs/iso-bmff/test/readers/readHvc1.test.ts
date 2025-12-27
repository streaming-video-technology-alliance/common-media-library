import { assert, describe, filterBoxes, it, readHvc1, readStsd, type SampleDescriptionBox, type VisualSampleEntryBox } from '../util/box.ts'

describe('readHvc1', function () {
	it('should correctly parse the box', function () {
		const container = filterBoxes<
			SampleDescriptionBox<VisualSampleEntryBox<'hvc1'>> | VisualSampleEntryBox<'hvc1'>
		>('hvc1_init.mp4', [readStsd, readHvc1])

		assert.strictEqual(container[0].type, 'stsd')
		const box = container[0].entries[0]

		assert.strictEqual(box.type, 'hvc1')
		assert.strictEqual(box.size, 137)

		assert.deepStrictEqual(box.reserved1, [0, 0, 0, 0, 0, 0])
		assert.strictEqual(box.dataReferenceIndex, 1)
		assert.strictEqual(box.preDefined1, 0)
		assert.strictEqual(box.reserved2, 0)
		assert.deepStrictEqual(box.preDefined2, [0, 0, 0])
		assert.strictEqual(box.width, 192)
		assert.strictEqual(box.height, 108)
		assert.strictEqual(box.horizresolution, 72)
		assert.strictEqual(box.vertresolution, 72)
		assert.strictEqual(box.reserved3, 0)
		assert.strictEqual(box.frameCount, 1)
		assert.deepStrictEqual(box.compressorName, [0x0B, 0x48, 0x45, 0x56, 0x43, 0x20, 0x43, 0x6F,
			0x64, 0x69, 0x6E, 0x67, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]) // length + 'HEVC Coding'
		assert.strictEqual(box.depth, 24)
		assert.strictEqual(box.preDefined3, -1)
		assert.strictEqual(box.config.byteLength, 51)
	})
})
