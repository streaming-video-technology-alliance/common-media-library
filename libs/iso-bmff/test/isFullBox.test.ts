import { assert, describe, isFullBox, it } from './util/box.ts'

describe('isFullBox', function () {
	it('should return true for a full box', function () {
		// #region example
		const box = { type: 'tfdt', version: 1, flags: 0, baseMediaDecodeTime: 0 }

		assert.strictEqual(isFullBox(box), true)
		// #endregion example
	})

	it('should return false for a box with no version and no flags', function () {
		assert.strictEqual(isFullBox({ type: 'free' }), false)
	})

	it('should return false for null and for a value that is not an object', function () {
		assert.strictEqual(isFullBox(null), false)
		assert.strictEqual(isFullBox(undefined), false)
		assert.strictEqual(isFullBox(5), false)
		assert.strictEqual(isFullBox('tfdt'), false)
	})
})
