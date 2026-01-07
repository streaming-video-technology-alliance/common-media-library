import { assert, describe, it, writeMp4a, writeStsd } from '../util/box.ts'

describe('writeStsd', function () {
	it('should write a SampleDescriptionBox correctly', function () {
		// #region example
		const box = {
			type: 'stsd' as const,
			version: 0,
			flags: 0,
			entryCount: 1,
			entries: [{
				type: 'mp4a' as const,
				channelcount: 2,
				dataReferenceIndex: 1,
				preDefined: 65534,
				reserved1: [0, 0, 0, 0, 0, 0],
				reserved2: [0, 0],
				reserved3: 0,
				samplerate: 48000,
				samplesize: 16,
				boxes: [
					new Uint8Array([0, 0, 0, 50, 101, 115, 100, 115, 0, 0, 0, 0, 3, 128, 128, 34, 0, 0, 0, 4, 128, 128, 22, 64, 21, 0, 32, 0, 0, 1, 244, 0, 0, 1, 244, 0, 5, 128, 128, 5, 17, 144, 0, 0, 0, 6, 128, 128, 1, 2])
				]
				// size: 86
			}]
		}

		const writer = writeStsd(box, {
			writers: {
				mp4a: writeMp4a,
				stsd: writeStsd,
			}
		})
		const buffer = new Uint8Array(writer.buffer)

		assert.strictEqual(Buffer.compare(buffer, new Uint8Array([
			0, 0, 0, 102, // size
			115, 116, 115, 100, // type (stsd)
			0, // version
			0, 0, 0, // flags
			0, 0, 0, 1, // entryCount

			0, 0, 0, 86, // size
			109, 112, 52, 97, // type (mp4a)
			0, 0, 0, 0, 0, 0, // reserved1
			0, 1, // dataReferenceIndex
			0, 0, 0, 0, // reserved2 (first 4 bytes)
			0, 0, 0, 0, // reserved2 (last 4 bytes)
			0, 2, // channelcount
			0, 16, // samplesize
			255, 254, // preDefined
			0, 0, // reserved3
			187, 128, 0, 0, // samplerate

			0, 0, 0, 50, // size
			101, 115, 100, 115, // type (esds)
			0, 0, 0, 0, 3, 128, 128, 34, 0, 0, 0, 4, 128, 128, 22, 64, 21, 0, 32, 0, 0, 1, 244, 0, 0, 1, 244, 0, 5, 128, 128, 5, 17, 144, 0, 0, 0, 6, 128, 128, 1, 2
		])), 0)
		// #endregion example
	})
})

