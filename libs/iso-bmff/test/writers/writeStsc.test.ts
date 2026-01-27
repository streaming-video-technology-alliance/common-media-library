import { assert, describe, it, writeStsc } from '../util/box.ts'

describe('writeStsc', function () {
	it('should write a SampleToChunkBox correctly', function () {
		// #region example
		const box = {
			type: 'stsc' as const,
			version: 0,
			flags: 0,
			entryCount: 2,
			entries: [
				{
					firstChunk: 1,
					samplesPerChunk: 10,
					sampleDescriptionIndex: 1
				},
				{
					firstChunk: 5,
					samplesPerChunk: 5,
					sampleDescriptionIndex: 1
				}
			]
		}

		const writer = writeStsc(box)
		const buffer = new Uint8Array(writer.buffer)

		assert.strictEqual(Buffer.compare(buffer, new Uint8Array([
			0, 0, 0, 40, // size (8 + 4 + 4 + 24 = 40)
			115, 116, 115, 99, // type (stsc)
			0, // version
			0, 0, 0, // flags
			0, 0, 0, 2, // entryCount
			// entry 1
			0, 0, 0, 1, // firstChunk
			0, 0, 0, 10, // samplesPerChunk
			0, 0, 0, 1, // sampleDescriptionIndex
			// entry 2
			0, 0, 0, 5, // firstChunk
			0, 0, 0, 5, // samplesPerChunk
			0, 0, 0, 1 // sampleDescriptionIndex
		])), 0)
		// #endregion example
	})
})
