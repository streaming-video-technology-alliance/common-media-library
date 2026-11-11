import { assert, describe, it, writeTkhd, type TrackHeaderBox } from '../util/box.ts'

// The stored integers of a rotation of 90 degrees with a horizontal translation of 1080.
const ROTATION = [0, 0x10000, 0, -0x10000, 0, 0, 1080 * 0x10000, 0, 0x40000000]

function createBox(matrix: number[]): TrackHeaderBox {
	return {
		type: 'tkhd',
		version: 0,
		flags: 3,
		creationTime: 0,
		modificationTime: 0,
		trackId: 1,
		reserved1: 0,
		duration: 0,
		reserved2: [0, 0],
		layer: 0,
		alternateGroup: 0,
		volume: 0,
		reserved3: 0,
		matrix,
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
		const writer = writeTkhd({
			type: 'tkhd',
			version: 0,
			flags: 3,
			creationTime: 0,
			modificationTime: 0,
			trackId: 1,
			reserved1: 0,
			duration: 0,
			reserved2: [0, 0],
			layer: 0,
			alternateGroup: 0,
			volume: 0,
			reserved3: 0,
			matrix: [1, 0, 0, 0, 1, 0, 0, 0, 1],
			width: 1920,
			height: 1080,
		})
		// #endregion example

		assert.strictEqual(writer.byteLength, 92)
		assert.deepStrictEqual(
			storedMatrix(writer.buffer),
			[0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000],
		)
	})

	it('should write a negative matrix entry', function () {
		const writer = writeTkhd(createBox([0, 1, 0, -1, 0, 0, 1080, 0, 1]))

		assert.deepStrictEqual(storedMatrix(writer.buffer), ROTATION)
	})

	it('should write u, v, and w as 2.30 values', function () {
		const writer = writeTkhd(createBox([1, 0, -0.5, 0, 1, 1.5, 0, 0, 1]))

		assert.deepStrictEqual(
			storedMatrix(writer.buffer),
			[0x10000, 0, -0x20000000, 0, 0x10000, 0x60000000, 0, 0, 0x40000000],
		)
	})

	it('should write 0 for a missing matrix entry', function () {
		const writer = writeTkhd(createBox([1, 0, 0, 0, 1]))

		assert.deepStrictEqual(storedMatrix(writer.buffer), [0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0])
	})
})
