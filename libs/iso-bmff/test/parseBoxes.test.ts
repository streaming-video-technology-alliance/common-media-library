import { assert, describe, ftyp, it, parseBoxes, type FileTypeBox } from './util/box.ts'

describe('parseBoxes', function () {
	it('should parse a buffer', function () {
		// Sample 'ftyp' box (20 bytes)
		const arrayBuffer = new Uint8Array([0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x00, 0x01, 0x69, 0x73, 0x6f, 0x6d]).buffer
		const boxes = parseBoxes(arrayBuffer, { parsers: { ftyp } }) as FileTypeBox[]
		const box = boxes[0]

		assert.strictEqual(boxes.length, 1)
		assert.strictEqual(box.type, 'ftyp')
		assert.strictEqual(box.size, 20)
		assert.strictEqual(box.majorBrand, 'isom')
		assert.strictEqual(box.minorVersion, 1)
		assert.deepEqual(box.compatibleBrands, ['isom'])
	})

	it('should exit the parser if garbage is zero', function () {
		const zero = new Uint8Array(1500)
		const boxes = parseBoxes(zero.buffer)
		assert.strictEqual(boxes.length, 1)
		assert.strictEqual(boxes[0].size, 0)
	})
})
