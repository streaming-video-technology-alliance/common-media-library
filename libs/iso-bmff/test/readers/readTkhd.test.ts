import { assert, describe, it, readIsoBoxes, readTkhd, writeTkhd } from '../util/box.ts'

const IDENTITY = [0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000]

// A rotation of 90 degrees with a horizontal translation of 1080.
const ROTATION = [0, 0x10000, 0, -0x10000, 0, 0, 1080 * 0x10000, 0, 0x40000000]

// A version 0 tkhd box. The arguments are the stored integers of the fixed-point fields.
function createTkhd(volume: number, matrix: number[], width: number, height: number): Uint8Array {
	const bytes = new Uint8Array(92)
	const view = new DataView(bytes.buffer)

	view.setUint32(0, bytes.length)
	view.setUint32(4, 0x746b6864) // 'tkhd'
	view.setUint32(20, 1) // track_ID
	view.setInt16(44, volume)
	matrix.forEach((value, i) => view.setInt32(48 + i * 4, value))
	view.setUint32(84, width)
	view.setUint32(88, height)

	return bytes
}

function read(bytes: Uint8Array) {
	const [box] = readIsoBoxes(bytes, { readers: { tkhd: readTkhd } })

	assert.ok(box)
	assert.strictEqual(box.type, 'tkhd')

	return box
}

describe('readTkhd', function () {
	it('should read the default values', function () {
		const box = read(createTkhd(0x0100, IDENTITY, 1920 * 0x10000, 1080 * 0x10000))
		const [a, b, , c, d, , x, y] = box.matrix

		assert.strictEqual(box.trackId, 1)
		assert.strictEqual(box.volume, 1)
		assert.deepStrictEqual([a, b, c, d, x, y], [1, 0, 0, 1, 0, 0])
		assert.strictEqual(box.width, 1920)
		assert.strictEqual(box.height, 1080)
	})

	it('should read a negative layer', function () {
		const bytes = createTkhd(0, IDENTITY, 0, 0)
		new DataView(bytes.buffer).setInt16(40, -1)

		assert.strictEqual(read(bytes).layer, -1)
	})

	it('should read a negative alternate group', function () {
		const bytes = createTkhd(0, IDENTITY, 0, 0)
		new DataView(bytes.buffer).setInt16(42, -2)

		assert.strictEqual(read(bytes).alternateGroup, -2)
	})

	it('should read a negative volume', function () {
		assert.strictEqual(read(createTkhd(-0x0100, IDENTITY, 0, 0)).volume, -1)
		assert.strictEqual(read(createTkhd(-0x80, IDENTITY, 0, 0)).volume, -0.5)
	})

	it('should read a negative matrix entry', function () {
		const box = read(createTkhd(0, ROTATION, 1920 * 0x10000, 1080 * 0x10000))
		const [a, b, , c, d, , x, y] = box.matrix

		assert.deepStrictEqual([a, b, c, d, x, y], [0, 1, -1, 0, 1080, 0])
	})

	it('should read the width and the height as unsigned values', function () {
		const box = read(createTkhd(0, IDENTITY, 0x9c408000, 0xffff0000))

		assert.strictEqual(box.width, 40000.5)
		assert.strictEqual(box.height, 65535)
	})

	it('should read values that writeTkhd writes back as the same bytes', function () {
		const bytes = createTkhd(-0x80, ROTATION, 0x9c408000, 1080 * 0x10000)
		const view = new DataView(bytes.buffer)
		view.setInt16(40, -1)
		view.setInt16(42, -2)

		const writer = writeTkhd(read(bytes))

		assert.deepStrictEqual(new Uint8Array(writer.buffer), bytes)
	})
})
