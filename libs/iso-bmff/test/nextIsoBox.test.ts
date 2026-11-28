import { load } from './util/load.ts'
import { reduceUint8Arrays } from './util/reduceUint8Arrays.ts'
import { boxBytes } from './util/wideBoxes.ts'
import { assert, createIsoBoxReadCursor, describe, it, nextIsoBox, seekIsoBox } from './util/box.ts'

const MFHD = boxBytes('mfhd', new Uint8Array([0, 0, 0, 0, 0, 0, 0, 7]))
const MDAT = boxBytes('mdat', new Uint8Array([0xaa, 0xbb]))

describe('nextIsoBox', function () {
	it('should return the type of each box and move the position past the box', function () {
		// #region example
		const cursor = createIsoBoxReadCursor(load('mss_moof_tfdt.mp4'))
		const types: string[] = []

		for (let type = nextIsoBox(cursor); type; type = nextIsoBox(cursor)) {
			types.push(type) // moof, then mdat
		}
		// #endregion example

		assert.deepStrictEqual(types, ['moof', 'mdat'])
		assert.strictEqual(cursor.pos, cursor.end)
	})

	it('should step over the child boxes of a box from seekIsoBox', function () {
		const traf = seekIsoBox(load('mss_moof_tfdt.mp4'), ['moof', 'traf'])
		const types: string[] = []

		assert.ok(traf)

		for (let type = nextIsoBox(traf); type; type = nextIsoBox(traf)) {
			types.push(type)
		}

		assert.deepStrictEqual(types, ['tfhd', 'tfdt', 'trun'])
	})

	it('should cover the complete box from the old position to the new position', function () {
		const cursor = createIsoBoxReadCursor(reduceUint8Arrays([MFHD, MDAT]))

		nextIsoBox(cursor)

		const start = cursor.pos

		assert.strictEqual(nextIsoBox(cursor), 'mdat')
		assert.strictEqual(cursor.pos - start, MDAT.length)
	})

	it('should return null and not move the position before a truncated box', function () {
		const cursor = createIsoBoxReadCursor(reduceUint8Arrays([MFHD, MDAT.subarray(0, 9)]))

		assert.strictEqual(nextIsoBox(cursor), 'mfhd')
		assert.strictEqual(nextIsoBox(cursor), null)
		assert.strictEqual(cursor.pos, MFHD.length)
	})

	it('should return null and not move the position before a uuid box with no room for usertype', function () {
		const cursor = createIsoBoxReadCursor(
			reduceUint8Arrays([boxBytes('uuid', new Uint8Array(15)), MDAT]),
		)

		assert.strictEqual(nextIsoBox(cursor), null)
		assert.strictEqual(cursor.pos, 0)
	})

	it('should count the positions from the first byte of a subarray input', function () {
		const bytes = reduceUint8Arrays([MDAT, MFHD, MDAT])
		const cursor = createIsoBoxReadCursor(bytes.subarray(MDAT.length))

		assert.strictEqual(nextIsoBox(cursor), 'mfhd')
		assert.strictEqual(cursor.pos, MFHD.length)
	})

	it('should return null for a largesize above the data and above 2^53', function () {
		const large = new Uint8Array(24)
		const view = new DataView(large.buffer)

		view.setUint32(0, 1)
		view.setUint32(4, 0x6d646174) // mdat
		view.setUint32(8, 0x00400000) // a largesize of 2^54

		const cursor = createIsoBoxReadCursor(large)

		assert.strictEqual(nextIsoBox(cursor), null)
		assert.strictEqual(cursor.pos, 0)
	})

	it('should return null at the end of the cursor', function () {
		const cursor = createIsoBoxReadCursor(new Uint8Array(0))

		assert.strictEqual(nextIsoBox(cursor), null)
	})
})
