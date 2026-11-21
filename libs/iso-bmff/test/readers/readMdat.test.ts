import { assert, describe, findBox, it, readIsoBoxes, readMdat } from '../util/box.ts'

describe('readMdat', function () {
	it('should correctly parse the readMdat box', function () {
		const box = findBox('captions.mp4', 'mdat', { readers: { mdat: readMdat } })

		assert.strictEqual(box.type, 'mdat')
		assert.strictEqual(box.data.byteLength, 21522)
	})

	it('should return a view of the input when the input starts after byte 0', function () {
		const buffer = new Uint8Array([9, 9, 9, 0, 0, 0, 11, 0x6d, 0x64, 0x61, 0x74, 1, 2, 3])
		const input = buffer.subarray(3)

		const [box] = readIsoBoxes(input, { readers: { mdat: readMdat } })

		assert.ok(box.type === 'mdat' && 'data' in box)
		assert.deepStrictEqual(Array.from(box.data), [1, 2, 3])
		assert.strictEqual(box.data.buffer, buffer.buffer)
		assert.strictEqual(box.data.byteOffset, 11)
	})
})
