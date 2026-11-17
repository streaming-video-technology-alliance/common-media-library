import { isFullBox } from '@svta/cml-iso-bmff'
import assert from 'node:assert'
import { describe, it } from 'vite-plus/test'

describe('isFullBox', function () {
	it('should return true for a box with version and flags', function () {
		// #region example
		const box = { type: 'mfhd', version: 0, flags: 0, sequenceNumber: 1 }
		const fullBox = isFullBox(box)
		// #endregion example

		assert.strictEqual(fullBox, true)
	})

	it('should return false for a box with no version', function () {
		assert.strictEqual(isFullBox({ type: 'moov', boxes: [] }), false)
	})
})
