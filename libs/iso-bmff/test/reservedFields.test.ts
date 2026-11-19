import {
	assert,
	createDefaultReaderConfig,
	createDefaultWriterConfig,
	describe,
	isIsoBoxType,
	it,
	readIsoBoxes,
	readMp4a,
	readSidx,
	writeAvc1,
	writeHdlr,
	writeIsoBox,
	writeMdhd,
	writeMp4a,
	writeMvhd,
	writeSidx,
	writeTenc,
	type IsoBoxStreamable,
} from './util/box.ts'
import { boxBytes, type BoxField } from './util/wideBoxes.ts'

const IDENTITY: BoxField[] = [0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000].map(value => [
	value,
	4,
])

// Each function builds a box with `fill` in every reserved byte.
const RESERVED_BOXES: Record<string, (fill: number) => Uint8Array> = {
	mvhd: fill =>
		boxBytes(
			'mvhd',
			[0, 4],
			[1, 4],
			[2, 4],
			[1000, 4],
			[5000, 4],
			[0x10000, 4],
			[0x100, 2],
			new Uint8Array(10).fill(fill),
			...IDENTITY,
			new Uint8Array(24),
			[2, 4],
		),
	tkhd: fill =>
		boxBytes(
			'tkhd',
			[3, 4],
			[1, 4],
			[2, 4],
			[1, 4],
			new Uint8Array(4).fill(fill),
			[5000, 4],
			new Uint8Array(8).fill(fill),
			[0, 2],
			[0, 2],
			[0x100, 2],
			new Uint8Array(2).fill(fill),
			...IDENTITY,
			[640 * 0x10000, 4],
			[360 * 0x10000, 4],
		),
	smhd: fill => boxBytes('smhd', [0, 4], [0x100, 2], new Uint8Array(2).fill(fill)),
	sidx: fill =>
		boxBytes(
			'sidx',
			[0, 4],
			[1, 4],
			[1000, 4],
			[0, 4],
			[0, 4],
			new Uint8Array(2).fill(fill),
			[1, 2],
			[100, 4],
			[1000, 4],
			[0x90000000, 4],
		),
	tfra: fill =>
		boxBytes(
			'tfra',
			[0, 4],
			[1, 4],
			[(fill ? 0xffffffc0 : 0) | 0x15, 4],
			[1, 4],
			[0, 4],
			[0, 4],
			[1, 2],
			[1, 2],
			[1, 2],
		),
	mp4a: fill =>
		boxBytes(
			'mp4a',
			new Uint8Array(6).fill(fill),
			[1, 2],
			[1, 2],
			new Uint8Array(6).fill(fill),
			[2, 2],
			[16, 2],
			[0, 2],
			new Uint8Array(2).fill(fill),
			[48000 * 0x10000, 4],
		),
	avc1: fill =>
		boxBytes(
			'avc1',
			new Uint8Array(6).fill(fill),
			[1, 2],
			[0, 2],
			new Uint8Array(2).fill(fill),
			new Uint8Array(12),
			[640, 2],
			[360, 2],
			[0x480000, 4],
			[0x480000, 4],
			new Uint8Array(4).fill(fill),
			[1, 2],
			new Uint8Array(32),
			[0x18, 2],
			[0xffff, 2],
		),
}

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

		assert.ok(isIsoBoxType('mp4a', box))
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
		assert.deepStrictEqual(bytes.subarray(28, 32), new Uint8Array(4))
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
		assert.deepStrictEqual(bytes.subarray(16, 32), new Uint8Array(16))
		assert.deepStrictEqual(bytes.subarray(44, 48), new Uint8Array(4))
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

	for (const [type, build] of Object.entries(RESERVED_BOXES)) {
		it(`should write 0 in the reserved fields of a ${type} box with other values there`, function () {
			const [box] = readIsoBoxes(build(0xff), createDefaultReaderConfig())

			assert.deepStrictEqual(
				writeIsoBox(box as IsoBoxStreamable, createDefaultWriterConfig()),
				build(0),
			)
		})
	}

	it('should write zeros for a missing preDefined and reserved of hdlr', function () {
		const bytes = new Uint8Array(
			writeHdlr({ type: 'hdlr', version: 0, flags: 0, handlerType: 'vide', name: '' }).buffer,
		)

		assert.deepStrictEqual(bytes.subarray(12, 16), new Uint8Array(4))
		assert.deepStrictEqual(bytes.subarray(20, 32), new Uint8Array(12))
	})

	it('should write zeros for a missing preDefined of mdhd', function () {
		const bytes = new Uint8Array(
			writeMdhd({
				type: 'mdhd',
				version: 0,
				flags: 0,
				creationTime: 0,
				modificationTime: 0,
				timescale: 1000,
				duration: 0,
				language: 'und',
			}).buffer,
		)

		assert.deepStrictEqual(bytes.subarray(30, 32), new Uint8Array(2))
	})

	it('should write and read a sidx reference of type 1', function () {
		const reference = {
			referenceType: 1,
			referencedSize: 100,
			subsegmentDuration: 1000,
			startsWithSap: 1,
			sapType: 0,
			sapDeltaTime: 0x0abcdef,
		}
		const bytes = writeIsoBox(
			{
				type: 'sidx',
				version: 0,
				flags: 0,
				referenceId: 1,
				timescale: 1000,
				earliestPresentationTime: 0,
				firstOffset: 0,
				references: [reference],
			},
			{ writers: { sidx: writeSidx } },
		)
		const [box] = readIsoBoxes(bytes, { readers: { sidx: readSidx } })

		assert.deepStrictEqual(
			bytes.subarray(32, 44),
			new Uint8Array([0x80, 0, 0, 100, 0, 0, 3, 0xe8, 0x80, 0xab, 0xcd, 0xef]),
		)
		assert.ok(isIsoBoxType('sidx', box))
		assert.deepStrictEqual(box.references, [reference])
	})
})
