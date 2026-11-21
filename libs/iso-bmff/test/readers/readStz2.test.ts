import { assert, describe, isIsoBoxType, it, readIsoBoxes, readStz2 } from '../util/box.ts'
import { boxBytes } from '../util/wideBoxes.ts'

const read = (bytes: Uint8Array) => {
	const [box] = readIsoBoxes(bytes, { readers: { stz2: readStz2 } })

	assert.ok(isIsoBoxType('stz2', box))

	return box
}

describe('readStz2', function () {
	it('should read entries of 8 bits', function () {
		// #region example
		const bytes = boxBytes('stz2', [0, 1], [0, 3], [0, 3], [8, 1], [2, 4], [5, 1], [6, 1])
		const [box] = readIsoBoxes(bytes, { readers: { stz2: readStz2 } })

		assert.ok(isIsoBoxType('stz2', box))
		assert.strictEqual(box.fieldSize, 8)
		assert.deepStrictEqual(box.entrySize, [5, 6])
		// #endregion example
	})

	it('should read entries of 16 bits', function () {
		const box = read(boxBytes('stz2', [0, 1], [0, 3], [0, 3], [16, 1], [2, 4], [1000, 2], [2, 2]))

		assert.deepStrictEqual(box.entrySize, [1000, 2])
	})

	it('should read two entries of 4 bits from each byte, and skip the padding', function () {
		const box = read(boxBytes('stz2', [0, 1], [0, 3], [0, 3], [4, 1], [3, 4], [0x12, 1], [0x30, 1]))

		assert.deepStrictEqual(box.entrySize, [1, 2, 3])
	})

	it('should return no entries for a field size that is not 4, 8, or 16', function () {
		const box = read(boxBytes('stz2', [0, 1], [0, 3], [0, 3], [5, 1], [2, 4], [0xff, 1], [0xff, 1]))

		assert.strictEqual(box.fieldSize, 5)
		assert.deepStrictEqual(box.entrySize, [])
	})
})
