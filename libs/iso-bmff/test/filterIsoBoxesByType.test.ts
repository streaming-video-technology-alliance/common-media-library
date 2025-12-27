import { assert, describe, filterIsoBoxesByType, it } from './util/box.ts'
import { load } from './util/load.ts'

describe('filterIsoBoxesByType', function () {
	it('filters boxes by type', function () {
		const buffer = load('./captions_fragmented.mp4')
		const boxes = filterIsoBoxesByType(buffer, 'mdat')

		assert.strictEqual(boxes.length, 158)
		assert.strictEqual(boxes.every(box => box.type === 'mdat'), true)
	})
})
