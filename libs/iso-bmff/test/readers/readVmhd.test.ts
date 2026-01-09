import { assert, describe, filterBoxes, it, readVmhd } from '../util/box.ts'

describe('readVmhd', function () {
	it('should correctly parse the box from sample data', function () {
		const boxes = filterBoxes('240fps_go_pro_hero_4.mp4', 'vmhd', { readers: { vmhd: readVmhd } })

		assert.strictEqual(boxes.length, 1)
		assert.strictEqual(boxes[0].type, 'vmhd')
		assert.strictEqual(boxes[0].graphicsmode, 0)
		assert.deepStrictEqual(boxes[0].opcolor, [0, 0, 0])
	})
})
