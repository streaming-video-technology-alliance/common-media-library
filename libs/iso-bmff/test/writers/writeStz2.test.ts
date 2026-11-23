import { writeWith } from '../util/writeWith.ts'
import { assert, describe, it, writeIsoBox, writeStz2 } from '../util/box.ts'
import { boxBytes } from '../util/wideBoxes.ts'

describe('writeStz2', function () {
	it('should write entries of 8 bits', function () {
		// #region example
		const bytes = writeIsoBox(
			{ type: 'stz2', version: 0, flags: 0, fieldSize: 8, entrySize: [5, 6] },
			{ writers: { stz2: writeStz2 } },
		)
		// #endregion example

		assert.deepStrictEqual(
			bytes,
			boxBytes('stz2', [0, 1], [0, 3], [0, 3], [8, 1], [2, 4], [5, 1], [6, 1]),
		)
	})

	it('should write entries of 16 bits', function () {
		const bytes = writeWith(writeStz2, {
			type: 'stz2',
			version: 0,
			flags: 0,
			fieldSize: 16,
			entrySize: [1000, 2],
		})

		assert.deepStrictEqual(
			bytes,
			boxBytes('stz2', [0, 1], [0, 3], [0, 3], [16, 1], [2, 4], [1000, 2], [2, 2]),
		)
	})

	it('should write two entries of 4 bits in each byte, and pad the last byte with 0', function () {
		const bytes = writeWith(writeStz2, {
			type: 'stz2',
			version: 0,
			flags: 0,
			fieldSize: 4,
			entrySize: [1, 2, 3],
		})

		assert.deepStrictEqual(
			bytes,
			boxBytes('stz2', [0, 1], [0, 3], [0, 3], [4, 1], [3, 4], [0x12, 1], [0x30, 1]),
		)
	})

	it('should write an even number of entries of 4 bits with no padding byte', function () {
		const bytes = writeWith(writeStz2, {
			type: 'stz2',
			version: 0,
			flags: 0,
			fieldSize: 4,
			entrySize: [1, 2, 3, 4],
		})

		assert.deepStrictEqual(
			bytes,
			boxBytes('stz2', [0, 1], [0, 3], [0, 3], [4, 1], [4, 4], [0x12, 1], [0x34, 1]),
		)
	})

	it('should throw a RangeError for a field size that is not 4, 8, or 16', function () {
		assert.throws(
			() =>
				writeWith(writeStz2, {
					type: 'stz2',
					version: 0,
					flags: 0,
					fieldSize: 5,
					entrySize: [1, 2],
				}),
			/^RangeError: .*fieldSize.* received 5$/,
		)
	})

	it('should write the largest entry of 4 bits', function () {
		const bytes = writeWith(writeStz2, {
			type: 'stz2',
			version: 0,
			flags: 0,
			fieldSize: 4,
			entrySize: [15, 15],
		})

		assert.deepStrictEqual(
			bytes,
			boxBytes('stz2', [0, 1], [0, 3], [0, 3], [4, 1], [2, 4], [0xff, 1]),
		)
	})

	it('should throw a RangeError for an entry above 4 bits in the high half of a byte', function () {
		assert.throws(
			() =>
				writeWith(writeStz2, {
					type: 'stz2',
					version: 0,
					flags: 0,
					fieldSize: 4,
					entrySize: [16, 1],
				}),
			/^RangeError: .*entrySize.* received 16$/,
		)
	})

	it('should throw a RangeError for an entry above 4 bits in the low half of a byte', function () {
		assert.throws(
			() =>
				writeWith(writeStz2, {
					type: 'stz2',
					version: 0,
					flags: 0,
					fieldSize: 4,
					entrySize: [1, 16],
				}),
			/^RangeError: .*entrySize.* received 16$/,
		)
	})

	it('should throw a RangeError for an entry above 8 bits with the field size 8', function () {
		assert.throws(
			() =>
				writeWith(writeStz2, {
					type: 'stz2',
					version: 0,
					flags: 0,
					fieldSize: 8,
					entrySize: [256],
				}),
			/^RangeError: .*writeUint8.* received 256$/,
		)
	})
})
