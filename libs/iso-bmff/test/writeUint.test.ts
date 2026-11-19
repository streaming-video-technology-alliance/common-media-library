import {
	assert,
	createDefaultReaderConfig,
	createDefaultWriterConfig,
	describe,
	it,
	readIsoBoxes,
	writeIsoBox,
	type MovieHeaderBox,
} from './util/box.ts'
import { boxBytes } from './util/wideBoxes.ts'

const ALL_BITS_SET = new Uint8Array(8).fill(0xff)

function roundTrip(source: Uint8Array): Uint8Array {
	const [box] = readIsoBoxes(source, createDefaultReaderConfig())
	assert.ok(box)
	return writeIsoBox(box, createDefaultWriterConfig())
}

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
