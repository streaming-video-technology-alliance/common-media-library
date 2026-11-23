import { writeWith } from '../util/writeWith.ts'
import { assert, describe, it, writeIsoBox, writeMvhd, type MovieHeaderBox } from '../util/box.ts'
import { ROTATION } from '../util/matrices.ts'

function createBox(matrix: number[]): MovieHeaderBox {
	return {
		type: 'mvhd',
		version: 0,
		flags: 0,
		creationTime: 0,
		modificationTime: 0,
		timescale: 1000,
		duration: 0,
		rate: 1,
		volume: 1,
		matrix: matrix as MovieHeaderBox['matrix'],
		preDefined: [0, 0, 0, 0, 0, 0],
		nextTrackId: 2,
	}
}

// The stored integers of the nine matrix entries of a version 0 mvhd box.
function storedMatrix(buffer: ArrayBufferLike): number[] {
	const view = new DataView(buffer)

	return Array.from({ length: 9 }, (_, i) => view.getInt32(44 + i * 4))
}

describe('writeMvhd', function () {
	it('should write the identity matrix', function () {
		// #region example
		const writer = writeIsoBox(
			{
				type: 'mvhd',
				version: 0,
				flags: 0,
				creationTime: 0,
				modificationTime: 0,
				timescale: 1000,
				duration: 0,
				rate: 1,
				volume: 1,
				matrix: [1, 0, 0, 0, 1, 0, 0, 0, 1],
				preDefined: [0, 0, 0, 0, 0, 0],
				nextTrackId: 2,
			},
			{ writers: { mvhd: writeMvhd } },
		)
		// #endregion example

		assert.strictEqual(writer.byteLength, 108)
		assert.deepStrictEqual(
			storedMatrix(writer.buffer),
			[0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000],
		)
	})

	it('should write a negative matrix entry', function () {
		const writer = writeWith(writeMvhd, createBox([0, 1, 0, -1, 0, 0, 1080, 0, 1]))

		assert.deepStrictEqual(storedMatrix(writer.buffer), ROTATION)
	})

	it('should write u, v, and w as 2.30 values', function () {
		const writer = writeWith(writeMvhd, createBox([1, 0, -0.5, 0, 1, 1.5, 0, 0, 1]))

		assert.deepStrictEqual(
			storedMatrix(writer.buffer),
			[0x10000, 0, -0x20000000, 0, 0x10000, 0x60000000, 0, 0, 0x40000000],
		)
	})

	it('should throw a RangeError for a missing matrix entry', function () {
		assert.throws(
			() => writeWith(writeMvhd, createBox([1, 0, 0, 0, 1])),
			/^RangeError: .*writeInt32.* received NaN$/,
		)
	})

	it('should throw a RangeError for a matrix entry above the 2.30 range', function () {
		// 2 in a 2.30 field is 0x80000000, one above the largest signed value.
		assert.throws(
			() => writeWith(writeMvhd, createBox([1, 0, 0, 0, 1, 0, 0, 0, 2])),
			/^RangeError: .*writeInt32.* received 2147483648$/,
		)
	})

	it('should write a negative rate and a negative volume as signed fields', function () {
		const bytes = writeWith(writeMvhd, {
			...createBox([1, 0, 0, 0, 1, 0, 0, 0, 1]),
			rate: -0.5,
			volume: -0.5,
		})

		// rate is a signed 16.16 field at the offset 28. volume is a signed 8.8 field at the offset 32.
		assert.deepStrictEqual(Array.from(bytes.subarray(28, 34)), [0xff, 0xff, 0x80, 0x00, 0xff, 0x80])
	})

	it('should throw a RangeError for a rate above the signed 16.16 range', function () {
		// 32768 in a 16.16 field is 0x80000000.
		assert.throws(
			() => writeWith(writeMvhd, { ...createBox([1, 0, 0, 0, 1, 0, 0, 0, 1]), rate: 32768 }),
			/^RangeError: .*writeInt32.* received 2147483648$/,
		)
	})

	it('should throw a RangeError for a volume above the signed 8.8 range', function () {
		// 128 in an 8.8 field is 0x8000.
		assert.throws(
			() => writeWith(writeMvhd, { ...createBox([1, 0, 0, 0, 1, 0, 0, 0, 1]), volume: 128 }),
			/^RangeError: .*writeInt16.* received 32768$/,
		)
	})
})
