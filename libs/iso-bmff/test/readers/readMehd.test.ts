import { assert, describe, findBox, it, readMehd } from '../util/box.ts'

describe('readMehd', function () {
	it('should correctly parse the box', function () {
		const box = findBox('test_frag.mp4', readMehd)

		assert.strictEqual(box.type, 'mehd')
		assert.strictEqual(box.size, 16)
		assert.strictEqual(box.fragmentDuration, 2047)
	})
})
