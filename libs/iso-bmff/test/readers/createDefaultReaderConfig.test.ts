import {
	assert,
	createDefaultReaderConfig,
	createInt64OverflowReader,
	describe,
	findIsoBox,
	isIsoBoxType,
	it,
	readInt64AsBigInt,
	readIsoBoxes,
	readTfdt,
} from '../util/box.ts'
import { boxBytes } from '../util/wideBoxes.ts'

// A version 1 tfdt box. baseMediaDecodeTime is 2^53 + 1, which a number cannot hold.
const TFDT_V1 = boxBytes('tfdt', [1, 1], [0, 3], [BigInt('9007199254740993'), 8])

describe('createDefaultReaderConfig', function () {
	it('should read 64-bit fields as bigint with the int64 option', function () {
		// #region example
		// A moof box that holds a traf box with a version 1 tfdt box.
		// baseMediaDecodeTime is 2^53 + 1, which a number cannot hold.
		const bytes = new Uint8Array([
			0,
			0,
			0,
			36,
			0x6d,
			0x6f,
			0x6f,
			0x66, // moof
			0,
			0,
			0,
			28,
			0x74,
			0x72,
			0x61,
			0x66, // traf
			0,
			0,
			0,
			20,
			0x74,
			0x66,
			0x64,
			0x74,
			1,
			0,
			0,
			0, // tfdt, version 1
			0,
			0x20,
			0,
			0,
			0,
			0,
			0,
			1, // baseMediaDecodeTime
		])
		const boxes = readIsoBoxes(bytes, createDefaultReaderConfig({ int64: readInt64AsBigInt }))

		// The field is a bigint with the exact value.
		const tfdt = findIsoBox(boxes, box => isIsoBoxType('tfdt', box))
		// #endregion example

		assert.ok(tfdt)
		assert.strictEqual(tfdt.baseMediaDecodeTime, BigInt('9007199254740993'))
	})

	it('should read 64-bit fields as numbers with no argument', function () {
		const [box] = readIsoBoxes(TFDT_V1, createDefaultReaderConfig())

		assert.ok(box)
		assert.ok(isIsoBoxType('tfdt', box))
		assert.strictEqual(box.baseMediaDecodeTime, 2 ** 53)
	})

	it('should return a configuration with no int64 key by default', function () {
		const config = createDefaultReaderConfig()

		assert.deepStrictEqual(Object.keys(config), ['readers'])
		assert.deepStrictEqual(Object.keys(createDefaultReaderConfig({})), ['readers'])
		assert.strictEqual(config.readers?.['tfdt'], readTfdt)
	})

	it('should return the same readers with the option', function () {
		const int64 = createInt64OverflowReader(error => {
			throw error
		})
		const config = createDefaultReaderConfig({ int64 })

		assert.strictEqual(config.int64, int64)
		assert.deepStrictEqual(config.readers, createDefaultReaderConfig().readers)
	})
})
