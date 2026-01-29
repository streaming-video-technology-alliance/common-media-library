import { assert, describe, it, writeStco } from '../util/box.ts'

describe('writeStco', function () {
	it('should write a ChunkOffsetBox correctly', function () {
		// #region example
		const box = {
			type: 'stco' as const,
			version: 0,
			flags: 0,
			entryCount: 3,
			chunkOffset: [1000, 5000, 9000]
		}

		const writer = writeStco(box)
		const buffer = new Uint8Array(writer.buffer)

		assert.strictEqual(Buffer.compare(buffer, new Uint8Array([
			0, 0, 0, 28, // size (8 + 4 + 4 + 12 = 28)
			115, 116, 99, 111, // type (stco)
			0, // version
			0, 0, 0, // flags
			0, 0, 0, 3, // entryCount
			0, 0, 3, 232, // chunkOffset[0] (1000)
			0, 0, 19, 136, // chunkOffset[1] (5000)
			0, 0, 35, 40 // chunkOffset[2] (9000)
		])), 0)
		// #endregion example
	})
})
