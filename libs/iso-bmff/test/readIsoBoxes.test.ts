import { assert, describe, it, readFtyp, readIsoBoxes } from './util/box.ts'

describe('readIsoBoxes', function () {
	it('should read a buffer', function () {
		// Sample 'ftyp' box (20 bytes)
		const arrayBuffer = new Uint8Array([0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x00, 0x01, 0x69, 0x73, 0x6f, 0x6d]).buffer
		const boxes = readIsoBoxes(arrayBuffer, { readers: { ftyp: readFtyp } })

		assert.strictEqual(boxes.length, 1)

		const box = boxes[0]
		assert.strictEqual(box.type, 'ftyp')
		assert.strictEqual(box.size, 20)
		assert.strictEqual(box.majorBrand, 'isom')
		assert.strictEqual(box.minorVersion, 1)
		assert.deepEqual(box.compatibleBrands, ['isom'])
	})

	it('should exit if garbage is zero', function () {
		const zero = new Uint8Array(1500)
		const boxes = readIsoBoxes(zero.buffer)
		assert.strictEqual(boxes.length, 1)
		assert.strictEqual(boxes[0].size, 0)
	})
})
