import { mfro } from '@svta/cml-iso-bmff'
import { assert, describe, findBox, it } from './util/box.ts'

describe('mfro box', function () {
	it('should correctly parse the box', function () {
		const box = findBox('test_frag.mp4', mfro)

		assert.strictEqual(box.type, 'mfro')
		assert.strictEqual(box.size, 16)
		assert.strictEqual(box.mfraSize, 105)
	})
})
