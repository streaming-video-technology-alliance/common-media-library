import { assert, describe, it, parseBox, readMdat } from '../util/box.ts'

describe('readMdat', function () {
	it('should correctly parse the readMdat box', function () {
		const box = parseBox('captions.mp4', readMdat, 2)

		assert.strictEqual(box.type, 'mdat')
		assert.strictEqual(box.size, 21530)
		assert.strictEqual(box.data.byteLength, 21522)
	})
})
