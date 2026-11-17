import { assert, describe, findBox, readFree, it } from '../util/box.ts'

describe('readFree', () => {
	it('should correctly parse the box', () => {
		const box = findBox('captions.mp4', 'free', { readers: { free: readFree } })

		assert.strictEqual(box.type, 'free')
		assert.strictEqual(box.size, 59)
		assert.strictEqual(box.data.length, 51)
	})
})
