import { assert, describe, it, readIsoBoxes, readMvhd, writeMvhd } from '../util/box.ts'

const IDENTITY = [0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000]

// A rotation of 90 degrees with a horizontal translation of 1080.
const ROTATION = [0, 0x10000, 0, -0x10000, 0, 0, 1080 * 0x10000, 0, 0x40000000]

// A version 0 mvhd box. The arguments are the stored integers of the fixed-point fields.
function createMvhd(rate: number, volume: number, matrix: number[]): Uint8Array {
	const bytes = new Uint8Array(108)
	const view = new DataView(bytes.buffer)

	view.setUint32(0, bytes.length)
	view.setUint32(4, 0x6d766864) // 'mvhd'
	view.setUint32(20, 1000) // timescale
	view.setInt32(28, rate)
	view.setInt16(32, volume)
	matrix.forEach((value, i) => view.setInt32(44 + i * 4, value))
	view.setUint32(104, 2) // next_track_ID

	return bytes
}

function read(bytes: Uint8Array) {
	const [box] = readIsoBoxes(bytes, { readers: { mvhd: readMvhd } })

	assert.ok(box)
	assert.strictEqual(box.type, 'mvhd')

	return box
}

describe('readMvhd', function () {
	it('should read the default values', function () {
		const box = read(createMvhd(0x10000, 0x0100, IDENTITY))
		const [a, b, , c, d, , x, y] = box.matrix

		assert.strictEqual(box.timescale, 1000)
		assert.strictEqual(box.rate, 1)
		assert.strictEqual(box.volume, 1)
		assert.deepStrictEqual([a, b, c, d, x, y], [1, 0, 0, 1, 0, 0])
		assert.strictEqual(box.nextTrackId, 2)
	})

	it('should read a negative rate', function () {
		assert.strictEqual(read(createMvhd(-0x10000, 0x0100, IDENTITY)).rate, -1)
		assert.strictEqual(read(createMvhd(-0x8000, 0x0100, IDENTITY)).rate, -0.5)
	})

	it('should read a negative volume', function () {
		assert.strictEqual(read(createMvhd(0x10000, -0x0100, IDENTITY)).volume, -1)
		assert.strictEqual(read(createMvhd(0x10000, -0x80, IDENTITY)).volume, -0.5)
	})

	it('should read a negative matrix entry', function () {
		const box = read(createMvhd(0x10000, 0x0100, ROTATION))
		const [a, b, , c, d, , x, y] = box.matrix

		assert.deepStrictEqual([a, b, c, d, x, y], [0, 1, -1, 0, 1080, 0])
	})

	it('should read values that writeMvhd writes back as the same bytes', function () {
		const bytes = createMvhd(-0x8000, -0x80, ROTATION)
		const writer = writeMvhd(read(bytes))

		assert.deepStrictEqual(new Uint8Array(writer.buffer), bytes)
	})
})
