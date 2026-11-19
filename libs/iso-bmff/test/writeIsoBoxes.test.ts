import { deepStrictEqual, doesNotThrow, strictEqual, ok, throws } from 'node:assert'
import { readFile } from 'node:fs/promises'
import {
	describe,
	it,
	createDefaultReaderConfig,
	createDefaultWriterConfig,
	filterIsoBoxes,
	isIsoBoxType,
	readFtyp,
	readIsoBoxes,
	readStsd,
	writeFtyp,
	writeIsoBoxes,
	writeMdat,
	writeMfhd,
	writeStyp,
	writeSubs,
	writeTfdt,
	writeTfhd,
	writeTrun,
	type IsoBoxStreamable,
	type ParsedIsoBox,
} from './util/box.ts'
import { fixtureFiles } from './util/fixtureFiles.ts'
import { load } from './util/load.ts'
import { parseFile } from './util/parseFile.ts'
import { sourceOf } from './util/sources.ts'

function boxBytes(boxes: ParsedIsoBox[], types: string[]): Uint8Array[] {
	return filterIsoBoxes(boxes, box => types.includes(box.type)).map(box => sourceOf(box).bytes)
}

function sampleTableBytes(boxes: ParsedIsoBox[]): Uint8Array[] {
	return boxBytes(boxes, ['stco', 'stsc', 'stsz'])
}

function headerBytes(boxes: ParsedIsoBox[]): Uint8Array[] {
	return boxBytes(boxes, ['mvhd', 'tkhd', 'smhd'])
}

describe('writeIsoBoxes', function () {
	it('should write to a parsed file', async function () {
		// #region example
		const isoFile = await readFile(new URL('./fixtures/captions.mp4', import.meta.url))

		const boxes = readIsoBoxes(isoFile, {
			readers: {
				ftyp: readFtyp,
			},
		})

		const bytes = writeIsoBoxes(boxes, {
			writers: {
				ftyp: writeFtyp,
			},
		})

		deepStrictEqual(bytes, new Uint8Array(isoFile))
		// #endregion example
	})

	it('should write from raw boxes', async function () {
		const boxes: IsoBoxStreamable[] = [
			{
				type: 'styp',
				majorBrand: 'cmfs',
				minorVersion: 0,
				compatibleBrands: ['iso9', 'dash'],
			},
			{
				type: 'moof',
				boxes: [
					{
						type: 'mfhd',
						version: 0,
						flags: 0,
						sequenceNumber: 1,
					},
					{
						type: 'traf',
						boxes: [
							{
								type: 'tfhd',
								trackId: 1,
								version: 0,
								flags: 131072,
							},
							{
								type: 'tfdt',
								version: 1,
								flags: 0,
								baseMediaDecodeTime: 0,
							},
							{
								type: 'subs',
								version: 1,
								flags: 0,
								entries: [
									{
										sampleDelta: 1,
										subsamples: [
											{
												subsampleSize: 5,
												subsamplePriority: 0,
												discardable: 0,
												codecSpecificParameters: 0,
											},
											{
												subsampleSize: 6,
												subsamplePriority: 0,
												discardable: 0,
												codecSpecificParameters: 0,
											},
											{
												subsampleSize: 5,
												subsamplePriority: 0,
												discardable: 0,
												codecSpecificParameters: 0,
											},
										],
									},
								],
							},
							{
								type: 'trun',
								version: 0,
								flags: 1793,
								dataOffset: 160,
								samples: [
									{
										sampleDuration: 2000,
										sampleSize: 16,
										sampleFlags: 16777216,
									},
								],
							},
						],
					},
				],
			},
			{
				type: 'mdat',
				data: new Uint8Array([
					102, 105, 114, 115, 116, 115, 101, 99, 111, 110, 100, 116, 104, 105, 114, 100,
				]),
			},
		]

		const bytes = writeIsoBoxes(boxes, {
			writers: {
				styp: writeStyp,
				mfhd: writeMfhd,
				tfhd: writeTfhd,
				tfdt: writeTfdt,
				trun: writeTrun,
				subs: writeSubs,
				mdat: writeMdat,
			},
		})

		const isoFile = await readFile(new URL('./fixtures/subsample.m4s', import.meta.url))
		deepStrictEqual(bytes, new Uint8Array(isoFile))
	})

	it('should write every fixture that the default readers parse', function () {
		const files = fixtureFiles()

		ok(files.length > 0)

		for (const file of files) {
			const boxes = parseFile(file, createDefaultReaderConfig())

			doesNotThrow(() => writeIsoBoxes(boxes, createDefaultWriterConfig()), file)
		}
	})

	it('should keep the bytes of the stco, stsc, and stsz boxes of every fixture', function () {
		let count = 0

		for (const file of fixtureFiles()) {
			const boxes = parseFile(file, createDefaultReaderConfig())
			const original = sampleTableBytes(readIsoBoxes(load(file)))
			const written = writeIsoBoxes(boxes, createDefaultWriterConfig())

			deepStrictEqual(sampleTableBytes(readIsoBoxes(written)), original, file)
			count += original.length
		}

		ok(count > 0)
	})

	it('should keep the bytes of the mvhd, tkhd, and smhd boxes of every fixture', function () {
		let count = 0

		for (const file of fixtureFiles()) {
			const boxes = parseFile(file, createDefaultReaderConfig())
			const original = headerBytes(readIsoBoxes(load(file)))
			const written = writeIsoBoxes(boxes, createDefaultWriterConfig())

			deepStrictEqual(headerBytes(readIsoBoxes(written)), original, file)
			count += original.length
		}

		ok(count > 0)
	})

	it('should exit if boxes are empty', function () {
		const bytes = writeIsoBoxes([], createDefaultWriterConfig())
		strictEqual(bytes.length, 0)
	})

	it('should write the boxes of a read with no configuration', async function () {
		const isoFile = await readFile(new URL('./fixtures/captions.mp4', import.meta.url))

		deepStrictEqual(writeIsoBoxes(readIsoBoxes(isoFile)), new Uint8Array(isoFile))
	})

	it('should write a configuration with no writers map', function () {
		const free = new Uint8Array([0x00, 0x00, 0x00, 0x08, 0x66, 0x72, 0x65, 0x65])

		deepStrictEqual([...writeIsoBoxes([free], {})], [...free])
	})

	it('should copy a box given as a view over a SharedArrayBuffer', function () {
		const bytes = [0x00, 0x00, 0x00, 0x08, 0x66, 0x72, 0x65, 0x65]
		const shared = new Uint8Array(new SharedArrayBuffer(bytes.length))
		shared.set(bytes)

		const result = writeIsoBoxes([shared], createDefaultWriterConfig())

		ok(result.buffer instanceof ArrayBuffer)
		deepStrictEqual([...result], bytes)
	})

	it('should copy a box given as a view over an ArrayBuffer', function () {
		const plain = new Uint8Array([0x00, 0x00, 0x00, 0x08, 0x66, 0x72, 0x65, 0x65])

		const result = writeIsoBoxes([plain], createDefaultWriterConfig())

		ok(result.buffer !== plain.buffer)
		deepStrictEqual(result, plain)
	})

	describe('a box with a boxes field and no writer', function () {
		const FREE = [0x00, 0x00, 0x00, 0x09, 0x66, 0x72, 0x65, 0x65, 0x01]
		const META = [0x00, 0x00, 0x00, 0x15, 0x6d, 0x65, 0x74, 0x61, 0x00, 0x00, 0x00, 0x00, ...FREE]
		const TRAF = [0x00, 0x00, 0x00, 0x11, 0x74, 0x72, 0x61, 0x66, ...FREE]

		function sampleEntry(type: string): Uint8Array {
			const [stsd] = filterIsoBoxes(
				parseFile('hvc1_init.mp4', { readers: { stsd: readStsd } }),
				box => box.type === 'stsd',
			)
			ok(isIsoBoxType('stsd', stsd))
			const bytes = sourceOf(stsd.boxes[0]).bytes.slice()
			bytes.set(
				[...type].map(char => char.charCodeAt(0)),
				4,
			)
			return bytes
		}

		it('should write the bytes of a raw meta box', function () {
			const boxes = readIsoBoxes(new Uint8Array(META))

			const bytes = writeIsoBoxes(boxes, { writers: {} })

			deepStrictEqual([...bytes], META)
		})

		it('should write the bytes of a raw sample entry with no writer', function () {
			const source = sampleEntry('av01')
			const boxes = readIsoBoxes(source, createDefaultReaderConfig())

			const bytes = writeIsoBoxes(boxes, createDefaultWriterConfig())

			strictEqual(bytes.length, 137)
			deepStrictEqual(bytes, source)
		})

		it('should write a parsed container as a container', function () {
			const [traf] = readIsoBoxes(new Uint8Array(TRAF))
			ok(isIsoBoxType('traf', traf))
			traf.boxes.push(new Uint8Array(FREE) as never)

			const bytes = writeIsoBoxes([traf], { writers: {} })

			deepStrictEqual(
				[...bytes],
				[0x00, 0x00, 0x00, 0x1a, 0x74, 0x72, 0x61, 0x66, ...FREE, ...FREE],
			)
		})

		it('should write a container that code builds as a container', function () {
			const box = { type: 'udta', boxes: [new Uint8Array(FREE)] } as IsoBoxStreamable

			const bytes = writeIsoBoxes([box], { writers: {} })

			deepStrictEqual([...bytes], [0x00, 0x00, 0x00, 0x11, 0x75, 0x64, 0x74, 0x61, ...FREE])
		})

		it('should throw for a box that code builds with no view and no writer', function () {
			const box: IsoBoxStreamable = { type: 'meta', version: 0, flags: 0, boxes: [] }

			throws(() => writeIsoBoxes([box], { writers: {} }), {
				message: 'No writer found for box type: meta',
			})
		})
	})
})
