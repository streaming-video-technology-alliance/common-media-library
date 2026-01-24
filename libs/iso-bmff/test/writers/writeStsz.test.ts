import { assert, describe, it, writeStsz } from '../util/box.ts'

describe('writeStsz', function () {
	it('should write a SampleSizeBox with uniform sample size', function () {
		// #region example
		const box = {
			type: 'stsz' as const,
			version: 0,
			flags: 0,
			sampleSize: 1024,
			sampleCount: 100
		}

		const writer = writeStsz(box)
		const buffer = new Uint8Array(writer.buffer)

		assert.strictEqual(Buffer.compare(buffer, new Uint8Array([
			0, 0, 0, 20, // size (8 + 4 + 4 + 4 = 20)
			115, 116, 115, 122, // type (stsz)
			0, // version
			0, 0, 0, // flags
			0, 0, 4, 0, // sampleSize (1024)
			0, 0, 0, 100 // sampleCount
		])), 0)
		// #endregion example
	})

	it('should write a SampleSizeBox with variable sample sizes', function () {
		const box = {
			type: 'stsz' as const,
			version: 0,
			flags: 0,
			sampleSize: 0,
			sampleCount: 3,
			entrySize: [512, 1024, 768]
		}

		const writer = writeStsz(box)
		const buffer = new Uint8Array(writer.buffer)

		assert.strictEqual(Buffer.compare(buffer, new Uint8Array([
			0, 0, 0, 32, // size (8 + 4 + 4 + 4 + 12 = 32)
			115, 116, 115, 122, // type (stsz)
			0, // version
			0, 0, 0, // flags
			0, 0, 0, 0, // sampleSize (0 means variable)
			0, 0, 0, 3, // sampleCount
			0, 0, 2, 0, // entrySize[0] (512)
			0, 0, 4, 0, // entrySize[1] (1024)
			0, 0, 3, 0 // entrySize[2] (768)
		])), 0)
	})
})
