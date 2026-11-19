import { assert, describe, findBox, it, readMdat } from '../util/box.ts'

describe('readMdat', function () {
	it('should correctly parse the readMdat box', function () {
		const box = findBox('captions.mp4', 'mdat', { readers: { mdat: readMdat } })

		assert.strictEqual(box.type, 'mdat')
		assert.strictEqual(box.data.byteLength, 21522)
	})
})
