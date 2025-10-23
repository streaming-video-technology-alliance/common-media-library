import { assert, describe, findBoxByType, it } from './util/box.ts'
import { load } from './util/load.ts'

describe('find a box by type', function () {
	it('find a box by type', function () {
		// Sample 'ftyp' box (20 bytes)
		const buffer = load('./captions.mp4')
		const box = findBoxByType(buffer, 'mdat')

		assert.ok(box)
		assert.strictEqual(box.type, 'mdat')
		assert.strictEqual(box.size, 21530)
	})
})
