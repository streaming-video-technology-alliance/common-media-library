import { assert, describe, filterBoxesByType, it } from './util/box.ts'
import { load } from './util/load.ts'

describe('filter boxes by type', function () {
	it('filter boxes by type', function () {
		const buffer = load('./captions_fragmented.mp4')
		const boxes = filterBoxesByType(buffer, 'mdat')

		assert.strictEqual(boxes.length, 158)
		assert.strictEqual(boxes.every(box => box.type === 'mdat'), true)
	})
})
