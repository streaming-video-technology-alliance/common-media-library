import { assert, describe, it, readFtyp, readIsoBoxes, readStsd, type IsoBoxReadView } from './util/box.ts'

describe('readIsoBoxes', function () {
	it('should read a buffer', function () {
		// #region example
		// Sample 'ftyp' box (20 bytes)
		const bytes = new Uint8Array([
			0x00, 0x00, 0x00, 0x14,
			0x66, 0x74, 0x79, 0x70,
			0x69, 0x73, 0x6f, 0x6d,
			0x00, 0x00, 0x00, 0x01,
			0x69, 0x73, 0x6f, 0x6d
		])
		const boxes = readIsoBoxes(bytes.buffer, { readers: { ftyp: readFtyp, stsd: readStsd } })

		assert.strictEqual(boxes.length, 1)

		const box = boxes[0]
		assert.strictEqual(box.type, 'ftyp')
		assert.strictEqual(box.size, 20)
		assert.strictEqual(box.majorBrand, 'isom')
		assert.strictEqual(box.minorVersion, 1)
		assert.deepEqual(box.compatibleBrands, ['isom'])
		// #endregion example
	})

	it('should exit if garbage is zero', function () {
		const zero = new Uint8Array(1500)
		const boxes = readIsoBoxes(zero.buffer)
		assert.strictEqual(boxes.length, 1)
		assert.strictEqual(boxes[0].size, 0)
	})

	it('should allow custom box readers', function () {
		const bytes = new Uint8Array([
			0x00, 0x00, 0x00, 0x0C,
			0x74, 0x65, 0x73, 0x74,
			0xFF, 0xFF, 0xFF, 0xFF,
		])

		const boxes = readIsoBoxes(bytes.buffer, {
			readers: {
				test: (view: IsoBoxReadView) => ({ type: 'test', value: view.readUint(4) })
			}
		})

		const box = boxes[0]
		assert.strictEqual(box.type, 'test')
		assert.strictEqual(box.value, 0xFFFFFFFF)
	})
})
