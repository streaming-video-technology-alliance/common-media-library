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

	it('should throw a RangeError for a sampleSize other than 0 and no sampleCount', function () {
		assert.throws(
			() => writeWith(writeStsz, { type: 'stsz', version: 0, flags: 0, sampleSize: 512 }),
			/^RangeError: .*writeUint32.* received undefined$/,
		)
	})

	it('should throw a RangeError for a sampleSize of 0 and no entrySize', function () {
		assert.throws(
			() => writeWith(writeStsz, { type: 'stsz', version: 0, flags: 0, sampleSize: 0 }),
			/^RangeError: .*entrySize.* received undefined$/,
		)
	})

	it('should write a count of 0 for an empty entrySize', function () {
		const bytes = writeWith(writeStsz, {
			type: 'stsz',
			version: 0,
			flags: 0,
			sampleSize: 0,
			entrySize: [],
		})

		assert.deepStrictEqual(bytes, boxBytes('stsz', [0, 1], [0, 3], [0, 4], [0, 4]))
	})
})
