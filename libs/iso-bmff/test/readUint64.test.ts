import { assert, describe, it, readIsoBoxes, type IsoBoxReadView } from './util/box.ts'

// #region example
// A tfdt reader that keeps baseMediaDecodeTime exact above 2^53 - 1.
const readTfdt64 = (view: IsoBoxReadView) => {
	const { version, flags } = view.readFullBox()
	const baseMediaDecodeTime = version === 1 ? view.readUint64() : BigInt(view.readUint(4))
	return { type: 'tfdt' as const, version, flags, baseMediaDecodeTime }
}
// #endregion example

// A version 1 tfdt box. baseMediaDecodeTime is 2^53 + 1, which a number cannot hold.
const TFDT_V1 = new Uint8Array([
	0x00, 0x00, 0x00, 0x14, // size = 20
	0x74, 0x66, 0x64, 0x74, // 'tfdt'
	0x01, 0x00, 0x00, 0x00, // version = 1, flags = 0
	0x00, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, // baseMediaDecodeTime
])

describe('IsoBoxReadView.readUint64', function () {
	it('should read a 64-bit field above 2^53 exactly', function () {
		const [box] = readIsoBoxes(TFDT_V1, { readers: { tfdt: readTfdt64 } })

		assert.ok(box)
		assert.strictEqual(box.type, 'tfdt')
		assert.strictEqual(box.baseMediaDecodeTime, BigInt('9007199254740993'))
		assert.notStrictEqual(Number(box.baseMediaDecodeTime), 9007199254740993)
	})

	it('should read the maximum value', function () {
		const bytes = TFDT_V1.slice()
		bytes.fill(0xff, 12)
		const [box] = readIsoBoxes(bytes, { readers: { tfdt: readTfdt64 } })

		assert.ok(box)
		assert.strictEqual(box.type, 'tfdt')
		assert.strictEqual(box.baseMediaDecodeTime, BigInt('0xffffffffffffffff'))
	})

	it('should advance the cursor by eight bytes', function () {
		readIsoBoxes(TFDT_V1, {
			readers: {
				tfdt: (view: IsoBoxReadView) => {
					view.readFullBox()
					const before = view.cursor
					view.readUint64()
					assert.strictEqual(view.cursor - before, 8)
					assert.strictEqual(view.bytesRemaining, 0)
					return { type: 'tfdt' as const }
				},
			},
		})
	})

	it('should throw on a box too short for the value', function () {
		assert.throws(() => {
			readIsoBoxes(TFDT_V1.subarray(0, 16), { readers: { tfdt: readTfdt64 } })
		}, RangeError)
	})
})
