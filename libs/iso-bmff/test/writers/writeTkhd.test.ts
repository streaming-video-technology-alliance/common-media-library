import { writeWith } from '../util/writeWith.ts'
import { assert, describe, it, writeIsoBox, writeTkhd, type TrackHeaderBox } from '../util/box.ts'
import { ROTATION } from '../util/matrices.ts'

function createBox(matrix: number[]): TrackHeaderBox {
	return {
		type: 'tkhd',
		version: 0,
		flags: 3,
		creationTime: 0,
		modificationTime: 0,
		trackId: 1,
		duration: 0,
		layer: 0,
		alternateGroup: 0,
		volume: 0,
		matrix: matrix as TrackHeaderBox['matrix'],
		width: 1920,
		height: 1080,
	}
}

// The stored integers of the nine matrix entries of a version 0 tkhd box.
function storedMatrix(buffer: ArrayBufferLike): number[] {
	const view = new DataView(buffer)

	return Array.from({ length: 9 }, (_, i) => view.getInt32(48 + i * 4))
}

describe('writeTkhd', function () {
	it('should write the identity matrix', function () {
		// #region example
		const writer = writeIsoBox(
			{
				type: 'tkhd',
				version: 0,
				flags: 3,
				creationTime: 0,
				modificationTime: 0,
				trackId: 1,
				duration: 0,
				layer: 0,
				alternateGroup: 0,
				volume: 0,
				matrix: [1, 0, 0, 0, 1, 0, 0, 0, 1],
				width: 1920,
				height: 1080,
			},
			{ writers: { tkhd: writeTkhd } },
		)
		// #endregion example

		assert.strictEqual(writer.byteLength, 92)
		assert.deepStrictEqual(
			storedMatrix(writer.buffer),
			[0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000],
		)
	})

	it('should write a negative matrix entry', function () {
		const writer = writeWith(writeTkhd, createBox([0, 1, 0, -1, 0, 0, 1080, 0, 1]))

		assert.deepStrictEqual(storedMatrix(writer.buffer), ROTATION)
	})

	it('should write u, v, and w as 2.30 values', function () {
		const writer = writeWith(writeTkhd, createBox([1, 0, -0.5, 0, 1, 1.5, 0, 0, 1]))

		assert.deepStrictEqual(
			storedMatrix(writer.buffer),
			[0x10000, 0, -0x20000000, 0, 0x10000, 0x60000000, 0, 0, 0x40000000],
		)
	})

	it('should throw a RangeError for a missing matrix entry', function () {
		assert.throws(
			() => writeWith(writeTkhd, createBox([1, 0, 0, 0, 1])),
			/^RangeError: .*writeInt32.* received NaN$/,
		)
	})

	it('should write a negative volume as a signed field', function () {
		const bytes = writeWith(writeTkhd, { ...createBox([1, 0, 0, 0, 1, 0, 0, 0, 1]), volume: -0.5 })

		// volume is a signed 8.8 field at the offset 44.
		assert.deepStrictEqual(Array.from(bytes.subarray(44, 46)), [0xff, 0x80])
	})

	it('should throw a RangeError for a volume above the signed 8.8 range', function () {
		// 128 in an 8.8 field is 0x8000.
		assert.throws(
			() => writeWith(writeTkhd, { ...createBox([1, 0, 0, 0, 1, 0, 0, 0, 1]), volume: 128 }),
			/^RangeError: .*writeInt16.* received 32768$/,
		)
	})

	it('should throw a RangeError for a negative width', function () {
		// width is an unsigned 16.16 field, and -1 is -65536 in units of the field.
		assert.throws(
			() => writeWith(writeTkhd, { ...createBox([1, 0, 0, 0, 1, 0, 0, 0, 1]), width: -1 }),
			/^RangeError: .*writeUint32.* received -65536$/,
		)
	})
})
