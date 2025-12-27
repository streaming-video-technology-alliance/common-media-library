import { assert, describe, findBox, it, readMfro } from '../util/box.ts'

describe('readMfro', function () {
	it('should correctly parse the box', function () {
		const box = findBox('test_frag.mp4', readMfro)

		assert.strictEqual(box.type, 'mfro')
		assert.strictEqual(box.size, 16)
		assert.strictEqual(box.mfraSize, 105)
	})
})
