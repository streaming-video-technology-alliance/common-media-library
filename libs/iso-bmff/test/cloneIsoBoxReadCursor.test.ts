import { load } from './util/load.ts'
import {
	assert,
	cloneIsoBoxReadCursor,
	createIsoBoxReadCursor,
	describe,
	it,
	nextIsoBox,
	readInt64AsBigInt,
	readTfdt,
	seekIsoBox,
} from './util/box.ts'

describe('cloneIsoBoxReadCursor', function () {
	it('should copy a cursor, so a move of the copy does not move the cursor', function () {
		// #region example
		const cursor = createIsoBoxReadCursor(load('mss_moof_tfdt.mp4'))
		const copy = cloneIsoBoxReadCursor(cursor)

		nextIsoBox(copy) // moves the copy past the moof box

		const unchanged = cursor.pos === 0 // true
		// #endregion example

		assert.strictEqual(unchanged, true)
		assert.ok(copy.pos > 0)
		assert.notStrictEqual(copy, cursor)
	})

	it('should copy the positions, the view, the readers, and the options', function () {
		const readers = { tfdt: readTfdt }
		const cursor = seekIsoBox(load('mss_moof_tfdt.mp4'), ['moof', 'traf'], {
			readers,
			int64: readInt64AsBigInt,
			spans: true,
		})

		assert.ok(cursor)

		const copy = cloneIsoBoxReadCursor(cursor)

		assert.deepStrictEqual(copy, cursor)
		assert.strictEqual(copy.view, cursor.view)
		assert.strictEqual(copy.readers, readers)
		assert.strictEqual(copy.int64, readInt64AsBigInt)
		assert.strictEqual(copy.spans, true)
	})
})
