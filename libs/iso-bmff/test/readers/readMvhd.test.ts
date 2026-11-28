import { writeWith } from '../util/writeWith.ts'
import {
	assert,
	describe,
	isIsoBoxType,
	it,
	readIsoBoxes,
	readMvhd,
	writeMvhd,
} from '../util/box.ts'
import { IDENTITY, LIMITS, PROJECTION, ROTATION } from '../util/matrices.ts'

// An mvhd box. The arguments are the stored integers of the fixed-point fields.
function createMvhd(
	rate: number,
	volume: number,
	matrix: number[],
	version: number = 0,
): Uint8Array {
	const shift = version === 1 ? 12 : 0
	const bytes = new Uint8Array(108 + shift)
	const view = new DataView(bytes.buffer)

	view.setUint32(0, bytes.length)
	view.setUint32(4, 0x6d766864) // 'mvhd'
	view.setUint8(8, version)
	view.setUint32(version === 1 ? 28 : 20, 1000) // timescale
	view.setInt32(28 + shift, rate)
	view.setInt16(32 + shift, volume)
	matrix.forEach((value, i) => view.setInt32(44 + shift + i * 4, value))
	view.setUint32(104 + shift, 2) // next_track_ID

	return bytes
}

function read(bytes: Uint8Array) {
	const [box] = readIsoBoxes(bytes, { readers: { mvhd: readMvhd } })

	assert.ok(box)
	assert.ok(isIsoBoxType('mvhd', box))

	return box
}

describe('readMvhd', function () {
	it('should read the default values', function () {
		const box = read(createMvhd(0x10000, 0x0100, IDENTITY))

		assert.strictEqual(box.timescale, 1000)
		assert.strictEqual(box.rate, 1)
		assert.strictEqual(box.volume, 1)
		assert.deepStrictEqual(box.matrix, [1, 0, 0, 0, 1, 0, 0, 0, 1])
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

		assert.deepStrictEqual(box.matrix, [0, 1, 0, -1, 0, 0, 1080, 0, 1])
	})

	it('should read u, v, and w as 2.30 values', function () {
		const box = read(createMvhd(0x10000, 0x0100, PROJECTION))

		assert.deepStrictEqual(box.matrix, [1, 0, -0.5, 0, 1, 1.5, 0, 0, 1])
	})

	it('should read the smallest and the largest values', function () {
		const smallest = read(createMvhd(-0x80000000, -0x8000, LIMITS))
		const largest = read(createMvhd(0x7fffffff, 0x7fff, LIMITS))

		assert.strictEqual(smallest.rate, -32768)
		assert.strictEqual(smallest.volume, -128)
		assert.strictEqual(largest.rate, 32767.999984741211)
		assert.strictEqual(largest.volume, 127.99609375)
		assert.deepStrictEqual(
			largest.matrix,
			[-32768, 32767.999984741211, -2, 0, 1, 1.9999999990686774, 0, 0, 1],
		)
	})

	it('should read a version 1 box', function () {
		const box = read(createMvhd(-0x8000, 0x0100, PROJECTION, 1))

		assert.strictEqual(box.version, 1)
		assert.strictEqual(box.timescale, 1000)
		assert.strictEqual(box.rate, -0.5)
		assert.strictEqual(box.volume, 1)
		assert.deepStrictEqual(box.matrix, [1, 0, -0.5, 0, 1, 1.5, 0, 0, 1])
		assert.strictEqual(box.nextTrackId, 2)
	})

	it('should read values that writeMvhd writes back as the same bytes', function () {
		const boxes = [
			createMvhd(-0x8000, -0x80, PROJECTION),
			createMvhd(-0x8000, -0x80, PROJECTION, 1),
			createMvhd(-0x80000000, -0x8000, LIMITS),
			createMvhd(0x7fffffff, 0x7fff, LIMITS),
		]

		for (const bytes of boxes) {
			const writer = writeWith(writeMvhd, read(bytes))

			assert.deepStrictEqual(new Uint8Array(writer.buffer), bytes)
		}
	})

	it('should read the six pre_defined values and write the same bytes', function () {
		// Each value has the top bit set, so a signed read gives a negative number.
		const preDefined = [0x80000001, 0x80000002, 0x80000003, 0x80000004, 0x80000005, 0x80000006]
		const bytes = createMvhd(0x10000, 0x0100, IDENTITY)
		const view = new DataView(bytes.buffer)

		// pre_defined is the 24 bytes after the matrix, at the offset 80.
		preDefined.forEach((value, i) => view.setUint32(80 + i * 4, value))

		const box = read(bytes)

		assert.deepStrictEqual(box.preDefined, preDefined)
		assert.deepStrictEqual(writeWith(writeMvhd, box), bytes)
	})
})
