import {
	assert,
	describe,
	it,
	readIsoBoxes,
	readMp4a,
	writeAvc1,
	writeIsoBox,
	writeMp4a,
	writeMvhd,
	writeTenc,
} from './util/box.ts'
import { boxBytes } from './util/wideBoxes.ts'

const AUDIO_V1 = boxBytes(
	'mp4a',
	new Uint8Array(6),
	[1, 2],
	[1, 2],
	new Uint8Array(6),
	[2, 2],
	[16, 2],
	[0, 2],
	[0, 2],
	[48000 * 0x10000, 4],
)

describe('reserved fields', function () {
	it('should read and write the entryVersion of an audio sample entry', function () {
		const [box] = readIsoBoxes(AUDIO_V1, { readers: { mp4a: readMp4a } })

		assert.ok(box?.type === 'mp4a')
		assert.strictEqual(box.entryVersion, 1)
		assert.deepStrictEqual(writeIsoBox(box, { writers: { mp4a: writeMp4a } }), AUDIO_V1)
	})

	it('should write an audio sample entry with no entryVersion and no preDefined', function () {
		const bytes = writeIsoBox(
			{
				type: 'mp4a',
				dataReferenceIndex: 1,
				channelCount: 2,
				sampleSize: 16,
				sampleRate: 48000,
				boxes: [],
			},
			{ writers: { mp4a: writeMp4a } },
		)

		assert.deepStrictEqual(bytes.subarray(16, 24), new Uint8Array(8))
	})

	it('should write -1 for a missing preDefined3 of a visual sample entry', function () {
		const writer = writeAvc1(
			{
				type: 'avc1',
				dataReferenceIndex: 1,
				width: 640,
				height: 360,
				horizResolution: 72,
				vertResolution: 72,
				frameCount: 1,
				compressorName: new Array<number>(32).fill(0),
				depth: 0x18,
				boxes: [],
			},
			{},
		)
		const bytes = new Uint8Array(writer.buffer)

		assert.deepStrictEqual(bytes.subarray(8, 16), new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1]))
		assert.deepStrictEqual(bytes.subarray(84, 86), new Uint8Array([0xff, 0xff]))
	})

	it('should write zeros for the reserved and pre_defined fields of mvhd', function () {
		const writer = writeMvhd({
			type: 'mvhd',
			version: 0,
			flags: 0,
			creationTime: 0,
			modificationTime: 0,
			timescale: 1000,
			duration: 0,
			rate: 1,
			volume: 1,
			matrix: [1, 0, 0, 0, 1, 0, 0, 0, 1],
			nextTrackId: 2,
		})
		const bytes = new Uint8Array(writer.buffer)

		assert.deepStrictEqual(bytes.subarray(34, 44), new Uint8Array(10))
		assert.deepStrictEqual(bytes.subarray(80, 104), new Uint8Array(24))
	})

	it('should write 0 for the reserved byte of tenc', function () {
		const writer = writeTenc({
			type: 'tenc',
			version: 1,
			flags: 0,
			defaultIsProtected: 1,
			defaultPerSampleIvSize: 8,
			defaultKid: new Array<number>(16).fill(1),
			defaultCryptByteBlock: 1,
			defaultSkipByteBlock: 9,
		})

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer).subarray(12, 16),
			new Uint8Array([0, 0x19, 1, 8]),
		)
	})
})
