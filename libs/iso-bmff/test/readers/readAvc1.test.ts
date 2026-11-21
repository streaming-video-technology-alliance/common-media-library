import {
	assert,
	describe,
	filterBoxes,
	isIsoBoxType,
	it,
	readAvc1,
	readIsoBoxes,
	readStsd,
	writeAvc1,
	writeIsoBox,
	type VisualSampleEntry,
} from '../util/box.ts'
import { boxBytes } from '../util/wideBoxes.ts'

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
		assert.strictEqual(box.compressorName, 'GoPro AVC encoder')
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

	it('should cut a long compressor name at a character boundary and read it back', function () {
		const box = {
			type: 'avc1' as const,
			dataReferenceIndex: 1,
			width: 640,
			height: 360,
			horizResolution: 72,
			vertResolution: 72,
			frameCount: 1,
			compressorName: 'é'.repeat(16),
			depth: 0x18,
			boxes: [],
		}
		const bytes = writeIsoBox(box, { writers: { avc1: writeAvc1 } })
		const [read] = readIsoBoxes(bytes, { readers: { avc1: readAvc1 } })

		assert.strictEqual(bytes[50], 30)
		assert.deepStrictEqual(bytes.subarray(81, 82), new Uint8Array(1))
		assert.ok(isIsoBoxType('avc1', read))
		assert.strictEqual(read.compressorName, 'é'.repeat(15))
	})

	it('should read at most 31 bytes for a length byte above 31', function () {
		const bytes = new Uint8Array(86)
		const view = new DataView(bytes.buffer)

		view.setUint32(0, 86)
		bytes.set([0x61, 0x76, 0x63, 0x31], 4)
		bytes[50] = 0xff
		bytes.fill(0x61, 51, 82)

		const [box] = readIsoBoxes(bytes, { readers: { avc1: readAvc1 } })

		assert.ok(isIsoBoxType('avc1', box))
		assert.strictEqual(box.compressorName, 'a'.repeat(31))
	})

	it('should read the values of the pre_defined fields and write the same bytes', function () {
		// A QuickTime file has data in the pre_defined fields.
		// Each value has the top bit set, so a signed read gives a negative number.
		const bytes = boxBytes(
			'avc1',
			new Uint8Array(6),
			[1, 2],
			[0x8001, 2],
			[0, 2],
			[0x80000002, 4],
			[0x80000003, 4],
			[0x80000004, 4],
			[640, 2],
			[360, 2],
			[0x480000, 4],
			[0x480000, 4],
			[0, 4],
			[1, 2],
			new Uint8Array(32),
			[0x18, 2],
			[0xffff, 2],
		)
		const box: VisualSampleEntry<'avc1'> = {
			type: 'avc1',
			dataReferenceIndex: 1,
			preDefined1: 0x8001,
			preDefined2: [0x80000002, 0x80000003, 0x80000004],
			width: 640,
			height: 360,
			horizResolution: 72,
			vertResolution: 72,
			frameCount: 1,
			compressorName: '',
			depth: 0x18,
			preDefined3: -1,
			boxes: [],
		}

		assert.deepStrictEqual(readIsoBoxes(bytes, { readers: { avc1: readAvc1 } }), [box])
		assert.deepStrictEqual(writeIsoBox(box, { writers: { avc1: writeAvc1 } }), bytes)
	})
})
