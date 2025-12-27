import { equal } from 'node:assert'
import { createWriteStream } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Writable } from 'node:stream'
import type { Fields } from '../src/boxes/types/Fields.ts'
import { describe, ftyp, IsoBoxReadableStream, it, readIsoBoxes, type IsoBox } from './util/box.ts'

describe('writeIsoBoxes', function () {
	it('should create a stream from raw boxes', async function () {
		const boxes: Fields<IsoBox>[] = [
			{
				type: 'ftyp',
				majorBrand: 'isom',
				minorVersion: 1,
				compatibleBrands: ['isom'],
			},
		]
		const stream = new IsoBoxReadableStream(boxes, { writers: { ftyp } })
	})

	it('should write to a stream', async function () {
		// #region example
		const isoFile = await readFile('test/fixtures/captions.mp4')
		const boxes = readIsoBoxes(new Uint8Array(isoFile), { readers: { ftyp } })
		const stream = new IsoBoxReadableStream(boxes, { writers: { ftyp } })

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
