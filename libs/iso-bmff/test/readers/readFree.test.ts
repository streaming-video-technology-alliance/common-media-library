import { assert, describe, readFree, it, parseBox } from '../util/box.ts'

describe('readFree', () => {
	it('should correctly parse the box', () => {
		const box = parseBox('captions.mp4', readFree, 3)

		assert.strictEqual(box.type, 'free')
		assert.strictEqual(box.size, 59)
		assert.strictEqual(box.data.length, 51)
	})
})
