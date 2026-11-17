import {
	assert,
	describe,
	it,
	IsoBoxReadView,
	readInt64AsBigInt,
	readIsoBoxes,
	type IsoInt64,
	type IsoInt64Reader,
} from './util/box.ts'
import { boxBytes } from './util/wideBoxes.ts'

// #region example
// A tfdt reader that follows the int64 option of the configuration.
const readTfdtWide = <V extends IsoInt64>(view: IsoBoxReadView<V>) => {
	const { version, flags } = view.readFullBox()
	const baseMediaDecodeTime = view.readWideUint(version === 1 ? 8 : 4)
	return { type: 'tfdt' as const, version, flags, baseMediaDecodeTime }
}
// #endregion example

// 2^53 + 1. A `number` rounds this value to 2^53.
const EXACT = BigInt('9007199254740993')
const TFDT_V1 = boxBytes('tfdt', [1, 1], [0, 3], [EXACT, 8])
const TFDT_V0 = boxBytes('tfdt', [0, 1], [0, 3], [1000, 4])

describe('IsoBoxReadView.readWideUint', function () {
	it('should return a number with no option', function () {
		const [box] = readIsoBoxes(TFDT_V1, { readers: { tfdt: readTfdtWide } })

		assert.ok(box)
		assert.strictEqual(box.type, 'tfdt')
		assert.strictEqual(box.baseMediaDecodeTime, 2 ** 53)
	})

	it('should return the result of the int64 function', function () {
		const [box] = readIsoBoxes(TFDT_V1, {
			int64: readInt64AsBigInt,
			readers: { tfdt: readTfdtWide },
		})
		const [version0] = readIsoBoxes(TFDT_V0, {
			int64: readInt64AsBigInt,
			readers: { tfdt: readTfdtWide },
		})

		assert.ok(box && version0)
		assert.strictEqual(box.type, 'tfdt')
		assert.strictEqual(version0.type, 'tfdt')
		assert.strictEqual(box.baseMediaDecodeTime, EXACT)
		assert.strictEqual(version0.baseMediaDecodeTime, BigInt(1000))
	})

	it('should be the same function as readUint with no option', function () {
		const view = new IsoBoxReadView(TFDT_V1)
		const empty = new IsoBoxReadView(TFDT_V1, {})

		assert.strictEqual(view.readWideUint, view.readUint)
		assert.strictEqual(view.readWideInt, view.readInt)
		assert.strictEqual(empty.readWideUint, empty.readUint)
		assert.strictEqual(empty.readWideInt, empty.readInt)
	})

	it('should pass the view, the size, and the sign to the int64 function', function () {
		const calls: unknown[][] = []
		const int64: IsoInt64Reader = (...args) => {
			calls.push(args)
			return args[0].readUint(args[1])
		}
		const view = new IsoBoxReadView(TFDT_V1, { int64 })

		assert.strictEqual(view.readWideUint(4), 20)
		assert.strictEqual(view.readWideInt(4), 0x74666474)
		assert.strictEqual(view.readWideUint(8), 0x0100000000200000)
		assert.strictEqual(view.cursor, 16)
		assert.deepStrictEqual(calls, [
			[view, 4, false],
			[view, 4, true],
			[view, 8, false],
		])
	})

	it('should work as a function that the reader takes from the view', function () {
		const { readWideUint, readWideInt, jump } = new IsoBoxReadView(TFDT_V1, {
			int64: readInt64AsBigInt,
		})

		jump(12)
		assert.strictEqual(readWideUint(4), BigInt(0x00200000))
		assert.strictEqual(readWideInt(4), BigInt(1))
	})

	it('should keep the option in the view of a child box', function () {
		const traf = boxBytes('traf', TFDT_V1)
		const view = new IsoBoxReadView(traf, { int64: readInt64AsBigInt })
		const box = view.readBox()
		const child = box.view.readBox()

		child.view.readFullBox()
		assert.strictEqual(child.view.readWideUint(8), EXACT)
	})
})

describe('IsoBoxReadView.readWideInt', function () {
	const SIGNED = boxBytes('test', [BigInt(-2), 8], [-3, 4])

	it('should return a signed number with no option', function () {
		const view = new IsoBoxReadView(SIGNED)

		view.jump(8)
		assert.strictEqual(view.readWideInt(8), -2)
		assert.strictEqual(view.readWideInt(4), -3)
	})

	it('should return a signed bigint with readInt64AsBigInt', function () {
		const view = new IsoBoxReadView(SIGNED, { int64: readInt64AsBigInt })

		view.jump(8)
		assert.strictEqual(view.readWideInt(8), BigInt(-2))
		assert.strictEqual(view.readWideInt(4), BigInt(-3))
		assert.strictEqual(view.bytesRemaining, 0)
	})
})
