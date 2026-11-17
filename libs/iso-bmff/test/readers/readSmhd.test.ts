import {
	assert,
	describe,
	filterBoxes,
	it,
	readIsoBoxes,
	readSmhd,
	writeSmhd,
} from '../util/box.ts'

// An smhd box. The argument is the stored integer of the balance.
function createSmhd(balance: number): Uint8Array {
	const bytes = new Uint8Array(16)
	const view = new DataView(bytes.buffer)

	view.setUint32(0, bytes.length)
	view.setUint32(4, 0x736d6864) // 'smhd'
	view.setInt16(12, balance)

	return bytes
}

function read(bytes: Uint8Array) {
	const [box] = readIsoBoxes(bytes, { readers: { smhd: readSmhd } })

	assert.ok(box)
	assert.strictEqual(box.type, 'smhd')

	return box
}

describe('readSmhd', function () {
	it('should correctly parse the box from sample data', function () {
		const boxes = filterBoxes('240fps_go_pro_hero_4.mp4', 'smhd', { readers: { smhd: readSmhd } })
		assert.strictEqual(boxes.length, 1)
		assert.strictEqual(boxes[0].type, 'smhd')
		assert.strictEqual(boxes[0].balance, 0.0)
	})

	it('should read the balance as a signed 8.8 value', function () {
		assert.strictEqual(read(createSmhd(0x0100)).balance, 1)
		assert.strictEqual(read(createSmhd(0x0080)).balance, 0.5)
		assert.strictEqual(read(createSmhd(-0x0080)).balance, -0.5)
		assert.strictEqual(read(createSmhd(-0x0100)).balance, -1)
	})

	it('should read the smallest and the largest balance', function () {
		assert.strictEqual(read(createSmhd(-0x8000)).balance, -128)
		assert.strictEqual(read(createSmhd(0x7fff)).balance, 127.99609375)
	})

	it('should read values that writeSmhd writes back as the same bytes', function () {
		for (const balance of [0x0100, -0x0080, -0x8000, 0x7fff]) {
			const bytes = createSmhd(balance)
			const writer = writeSmhd(read(bytes))

			assert.deepStrictEqual(new Uint8Array(writer.buffer), bytes)
		}
	})
})
