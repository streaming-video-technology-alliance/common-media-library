import { equal } from 'node:assert'
import { createWriteStream } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Writable } from 'node:stream'
import { describe, IsoBoxReadableStream, it, readFtyp, readIsoBoxes, writeFtyp, writeIsoBoxes, writeMdat, writeMfhd, writeStyp, writeSubs, writeTfdt, writeTfhd, writeTrun, type IsoBoxStreamable } from './util/box.ts'

describe('writeIsoBoxes', function () {
	it('should write from raw boxes', async function () {
		const boxes: IsoBoxStreamable[] = [
			{
				type: 'styp',
				majorBrand: 'cmfs',
				minorVersion: 0,
				compatibleBrands: ['iso9', 'dash']
			}, {
				type: 'moof',
				boxes: [
					{
						type: 'mfhd',
						version: 0,
						flags: 0,
						sequenceNumber: 1
					}, {
						type: 'traf',
						boxes: [
							{
								type: 'tfhd',
								trackId: 1,
								version: 0,
								flags: 131072,
							}, {
								type: 'tfdt',
								version: 1,
								flags: 0,
								baseMediaDecodeTime: 0,
							}, {
								type: 'subs',
								version: 1,
								flags: 0,
								entryCount: 1,
								entries: [
									{
										sampleDelta: 1,
										subsampleCount: 3,
										subsamples: [{
											subsampleSize: 5,
											subsamplePriority: 0,
											discardable: 0,
											codecSpecificParameters: 0,
										}, {
											subsampleSize: 6,
											subsamplePriority: 0,
											discardable: 0,
											codecSpecificParameters: 0,
										}, {
											subsampleSize: 5,
											subsamplePriority: 0,
											discardable: 0,
											codecSpecificParameters: 0,
										}],
									},
								],
							}, {
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
								]
							},
						],
					},
				],
			}, {
				type: 'mdat',
				data: new Uint8Array([
					102, 105, 114, 115, 116,
					115, 101, 99, 111, 110,
					100, 116, 104, 105, 114,
					100
				]),
			}
		]

		const stream = writeIsoBoxes(boxes, {
			writers: {
				styp: writeStyp,
				mfhd: writeMfhd,
				tfhd: writeTfhd,
				tfdt: writeTfdt,
				trun: writeTrun,
				subs: writeSubs,
				mdat: writeMdat,
			}
		})

		const isoFile = await readFile('test/fixtures/subsample.m4s')
		const copy = join(tmpdir(), 'subsample.mp4')
		await stream.pipeTo(Writable.toWeb(createWriteStream(copy)))

		equal(Buffer.compare(isoFile, await readFile(copy)), 0)
	})

	it('should write to a stream', async function () {
		// #region example
		const isoFile = await readFile('test/fixtures/captions.mp4')

		const boxes = readIsoBoxes(new Uint8Array(isoFile), {
			readers: {
				ftyp: readFtyp,
			}
		})

		const stream = writeIsoBoxes(boxes, {
			writers: {
				ftyp: writeFtyp,
			}
		})

		const copy = join(tmpdir(), 'captions-copy.mp4')
		await stream.pipeTo(Writable.toWeb(createWriteStream(copy)))

		equal(Buffer.compare(isoFile, await readFile(copy)), 0)
		// #endregion example
	})

	it('should exit if boxes are empty', async function () {
		const stream = new IsoBoxReadableStream([])
		const buffers = []

		for await (const data of stream) {
			buffers.push(data)
		}

		equal(buffers.length, 0)
	})
})
