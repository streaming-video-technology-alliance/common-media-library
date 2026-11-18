import {
	assert,
	createDefaultReaderConfig,
	createDefaultWriterConfig,
	describe,
	it,
	IsoBoxWriteView,
	readIsoBoxes,
	writeIsoBox,
	type MovieHeaderBox,
} from './util/box.ts'
import { body } from './util/bytes.ts'
import { boxBytes } from './util/wideBoxes.ts'

const ALL_BITS_SET = new Uint8Array(8).fill(0xff)

function roundTrip(source: Uint8Array): Uint8Array {
	const [box] = readIsoBoxes(source, createDefaultReaderConfig())
	assert.ok(box)
	return writeIsoBox(box, createDefaultWriterConfig())
}

describe('IsoBoxWriteView.writeUint', function () {
	it('should write all bits set for a value of 2^64 or more in 8 bytes', function () {
		// #region example
		// The nearest number to 2^64 - 1 is 2^64.
		const writer = new IsoBoxWriteView('test', 16)
		writer.writeUint(2 ** 64, 8)

		assert.deepStrictEqual(new Uint8Array(writer.buffer).subarray(8), ALL_BITS_SET)
		// #endregion example

		assert.deepStrictEqual(
			body(writer => writer.writeUint(2 ** 65, 8), 8),
			[...ALL_BITS_SET],
		)
		assert.deepStrictEqual(
			body(writer => writer.writeUint(Infinity, 8), 8),
			[...ALL_BITS_SET],
		)
	})

	it('should write the values below 2^64 in 8 bytes', function () {
		// 2^64 - 2048 is the largest number below 2^64.
		assert.deepStrictEqual(
			body(writer => writer.writeUint(2 ** 64 - 2048, 8), 8),
			[0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xf8, 0x00],
		)
		assert.deepStrictEqual(
			body(writer => writer.writeUint(2 ** 63, 8), 8),
			[0x80, 0, 0, 0, 0, 0, 0, 0],
		)
		assert.deepStrictEqual(
			body(writer => writer.writeUint(2 ** 32, 8), 8),
			[0, 0, 0, 1, 0, 0, 0, 0],
		)
		assert.deepStrictEqual(
			body(writer => writer.writeUint(2 ** 32 - 1, 8), 8),
			[0, 0, 0, 0, 0xff, 0xff, 0xff, 0xff],
		)
	})

	it('should write all bits set in 4 bytes', function () {
		assert.deepStrictEqual(
			body(writer => writer.writeUint(0xffffffff, 4), 4),
			[0xff, 0xff, 0xff, 0xff],
		)
	})

	it('should write a number of 2^64 or more with writeWideUint as writeUint does', function () {
		for (const value of [2 ** 64, 2 ** 65]) {
			assert.deepStrictEqual(
				body(writer => writer.writeWideUint(value, 8), 8),
				body(writer => writer.writeUint(value, 8), 8),
			)
		}
	})
})

describe('a read and a write with the default configs', function () {
	it('should keep a 64-bit field with all bits set', function () {
		const mehd = boxBytes('mehd', [1, 1], [0, 3], ALL_BITS_SET)
		const tfdt = boxBytes('tfdt', [1, 1], [0, 3], ALL_BITS_SET)
		const mvhd = writeIsoBox(
			{
				type: 'mvhd',
				version: 1,
				flags: 0,
				creationTime: 0,
				modificationTime: 0,
				timescale: 1000,
				duration: BigInt('0xffffffffffffffff'),
				rate: 1,
				volume: 1,
				matrix: [1, 0, 0, 0, 1, 0, 0, 0, 1],
				preDefined: [0, 0, 0, 0, 0, 0],
				nextTrackId: 2,
			} satisfies MovieHeaderBox<bigint | number>,
			createDefaultWriterConfig(),
		)

		assert.deepStrictEqual(roundTrip(mehd), mehd)
		assert.deepStrictEqual(roundTrip(tfdt), tfdt)
		assert.deepStrictEqual(roundTrip(mvhd), mvhd)
	})

	it('should keep a 32-bit field with all bits set', function () {
		const mehd = boxBytes('mehd', [0, 1], [0, 3], [0xffffffff, 4])
		const tfdt = boxBytes('tfdt', [0, 1], [0, 3], [0xffffffff, 4])

		assert.deepStrictEqual(roundTrip(mehd), mehd)
		assert.deepStrictEqual(roundTrip(tfdt), tfdt)
	})
})
