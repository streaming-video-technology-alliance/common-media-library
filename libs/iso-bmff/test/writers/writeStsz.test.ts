import { writeWith } from '../util/writeWith.ts'
import { assert, describe, it, writeIsoBox, writeStsz } from '../util/box.ts'
import { boxBytes } from '../util/wideBoxes.ts'

describe('writeStsz', function () {
	it('should write a SampleSizeBox with uniform sample size', function () {
		// #region example
		const box = {
			type: 'stsz' as const,
			version: 0,
			flags: 0,
			sampleSize: 1024,
			sampleCount: 100,
		}

		const writer = writeIsoBox(box, { writers: { stsz: writeStsz } })
		const buffer = new Uint8Array(writer.buffer)
		// #endregion example

		assert.strictEqual(
			Buffer.compare(
				buffer,
				new Uint8Array([
					0,
					0,
					0,
					20, // size (8 + 4 + 4 + 4 = 20)
					115,
					116,
					115,
					122, // type (stsz)
					0, // version
					0,
					0,
					0, // flags
					0,
					0,
					4,
					0, // sampleSize (1024)
					0,
					0,
					0,
					100, // sampleCount
				]),
			),
			0,
		)
	})

	it('should write a SampleSizeBox with variable sample sizes', function () {
		const box = {
			type: 'stsz' as const,
			version: 0,
			flags: 0,
			sampleSize: 0,
			entrySize: [512, 1024, 768],
		}

		const writer = writeWith(writeStsz, box)
		const buffer = new Uint8Array(writer.buffer)

		assert.strictEqual(
			Buffer.compare(
				buffer,
				new Uint8Array([
					0,
					0,
					0,
					32, // size (8 + 4 + 4 + 4 + 12 = 32)
					115,
					116,
					115,
					122, // type (stsz)
					0, // version
					0,
					0,
					0, // flags
					0,
					0,
					0,
					0, // sampleSize (0 means variable)
					0,
					0,
					0,
					3, // sampleCount
					0,
					0,
					2,
					0, // entrySize[0] (512)
					0,
					0,
					4,
					0, // entrySize[1] (1024)
					0,
					0,
					3,
					0, // entrySize[2] (768)
				]),
			),
			0,
		)
	})

	it('should write a count of 0 for a box with no count and no entrySize', function () {
		const uniform = writeWith(writeStsz, { type: 'stsz', version: 0, flags: 0, sampleSize: 512 })
		const empty = writeWith(writeStsz, { type: 'stsz', version: 0, flags: 0, sampleSize: 0 })

		assert.deepStrictEqual(uniform, boxBytes('stsz', [0, 1], [0, 3], [512, 4], [0, 4]))
		assert.deepStrictEqual(empty, boxBytes('stsz', [0, 1], [0, 3], [0, 4], [0, 4]))
	})
})
