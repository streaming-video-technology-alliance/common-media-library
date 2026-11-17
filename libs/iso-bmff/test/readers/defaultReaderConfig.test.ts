import {
	assert,
	createInt64OverflowReader,
	defaultReaderConfig,
	describe,
	it,
	readInt64AsBigInt,
	readIsoBoxes,
	readTfdt,
} from '../util/box.ts'
import { boxBytes } from '../util/wideBoxes.ts'

// A version 1 tfdt box. baseMediaDecodeTime is 2^53 + 1, which a number cannot hold.
const TFDT_V1 = boxBytes('tfdt', [1, 1], [0, 3], [BigInt('9007199254740993'), 8])

describe('defaultReaderConfig', function () {
	it('should read 64-bit fields as bigint with the int64 option', function () {
		// #region example
		const boxes = readIsoBoxes(TFDT_V1, defaultReaderConfig({ int64: readInt64AsBigInt }))

		for (const box of boxes) {
			if (box.type === 'tfdt') {
				// The field is a bigint with the exact value.
				assert.strictEqual(box.baseMediaDecodeTime, BigInt('9007199254740993'))
			}
		}
		// #endregion example

		assert.strictEqual(boxes.length, 1)
		assert.strictEqual(boxes[0].type, 'tfdt')
	})

	it('should read 64-bit fields as numbers with no argument', function () {
		const [box] = readIsoBoxes(TFDT_V1, defaultReaderConfig())

		assert.ok(box)
		assert.strictEqual(box.type, 'tfdt')
		assert.strictEqual(box.baseMediaDecodeTime, 2 ** 53)
	})

	it('should return a configuration with no int64 key by default', function () {
		const config = defaultReaderConfig()

		assert.deepStrictEqual(Object.keys(config), ['readers'])
		assert.deepStrictEqual(Object.keys(defaultReaderConfig({})), ['readers'])
		assert.strictEqual(config.readers?.['tfdt'], readTfdt)
	})

	it('should return the same readers with the option', function () {
		const int64 = createInt64OverflowReader(error => {
			throw error
		})
		const config = defaultReaderConfig({ int64 })

		assert.strictEqual(config.int64, int64)
		assert.deepStrictEqual(config.readers, defaultReaderConfig().readers)
	})
})
