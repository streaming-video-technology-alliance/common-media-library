import { deepStrictEqual, strictEqual } from 'node:assert'
import { readFile } from 'node:fs/promises'
import {
	createIsoBoxReadableStream,
	createDefaultWriterConfig,
	describe,
	it,
	readFtyp,
	readIsoBoxes,
	writeFree,
	writeFtyp,
	writeMdat,
	writeMfhd,
	writeStyp,
	writeSubs,
	writeTfdt,
	writeTfhd,
	writeTrun,
	type IsoBoxStreamable,
} from './util/box.ts'

describe('createIsoBoxReadableStream', function () {
	it('should write from a parsed file', async function () {
		// #region example
		const isoFile = await readFile(new URL('./fixtures/captions.mp4', import.meta.url))

		const boxes = readIsoBoxes(isoFile, {
			readers: {
				ftyp: readFtyp,
			},
		})

		const stream = createIsoBoxReadableStream(boxes, {
			writers: {
				ftyp: writeFtyp,
			},
		})

		const chunks: Uint8Array[] = []
		await stream.pipeTo(
			new WritableStream({
				write(chunk) {
					chunks.push(chunk)
				},
			}),
		)
		// #endregion example

		strictEqual(Buffer.compare(isoFile, Buffer.concat(chunks)), 0)
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
								entryCount: 1,
								entries: [
									{
										sampleDelta: 1,
										subsampleCount: 3,
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
								sampleCount: 1,
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

		const stream = createIsoBoxReadableStream(boxes, {
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
		const written = new Uint8Array(await new Response(stream).arrayBuffer())

		strictEqual(Buffer.compare(isoFile, written), 0)
	})

	it('should write the boxes of a read with no configuration', async function () {
		const isoFile = await readFile(new URL('./fixtures/captions.mp4', import.meta.url))
		const stream = createIsoBoxReadableStream(readIsoBoxes(isoFile))
		const written = new Uint8Array(await new Response(stream).arrayBuffer())

		strictEqual(Buffer.compare(isoFile, written), 0)
	})

	it('should exit if boxes are empty', async function () {
		const stream = createIsoBoxReadableStream([], createDefaultWriterConfig())
		const buffers = []

		for await (const data of stream) {
			buffers.push(data)
		}

		strictEqual(buffers.length, 0)
	})

	it('should close the source iterator once on cancel', async function () {
		let closeCount = 0

		function* source(): Generator<IsoBoxStreamable> {
			try {
				for (let i = 0; i < 3; i++) {
					yield { type: 'free', data: new Uint8Array([i]) }
				}
			} finally {
				closeCount++
			}
		}

		const stream = createIsoBoxReadableStream(source(), { writers: { free: writeFree } })
		const reader = stream.getReader()
		const first = await reader.read()

		deepStrictEqual(first.value, new Uint8Array([0, 0, 0, 9, 102, 114, 101, 101, 0]))

		await reader.cancel()

		strictEqual(closeCount, 1)
		deepStrictEqual(await reader.read(), { done: true, value: undefined })
		strictEqual(closeCount, 1)
	})

	it('should write every box of the source in order', async function () {
		const boxes: IsoBoxStreamable[] = [0, 1, 2].map(i => ({
			type: 'free',
			data: new Uint8Array([i]),
		}))
		const stream = createIsoBoxReadableStream(boxes, { writers: { free: writeFree } })
		const chunks: number[] = []

		for await (const data of stream) {
			chunks.push(data[8])
		}

		deepStrictEqual(chunks, [0, 1, 2])
	})
})
