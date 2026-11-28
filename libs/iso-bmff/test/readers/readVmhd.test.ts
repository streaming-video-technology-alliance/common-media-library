import {
	assert,
	describe,
	filterBoxes,
	it,
	readIsoBoxes,
	readVmhd,
	writeIsoBox,
	writeVmhd,
	type VideoMediaHeaderBox,
} from '../util/box.ts'
import { boxBytes } from '../util/wideBoxes.ts'

describe('readVmhd', function () {
	it('should correctly parse the box from sample data', function () {
		const boxes = filterBoxes('240fps_go_pro_hero_4.mp4', 'vmhd', { readers: { vmhd: readVmhd } })

		assert.strictEqual(boxes.length, 1)
		assert.strictEqual(boxes[0].type, 'vmhd')
		assert.strictEqual(boxes[0].graphicsMode, 0)
		assert.deepStrictEqual(boxes[0].opColor, [0, 0, 0])
	})

	it('should read a distinct value in each field and write the same bytes', function () {
		// Each value has the top bit set, so a signed read gives a negative number.
		const bytes = boxBytes(
			'vmhd',
			[0, 1],
			[1, 3],
			[0x8040, 2],
			[0x8001, 2],
			[0x8002, 2],
			[0x8003, 2],
		)
		const box: VideoMediaHeaderBox = {
			type: 'vmhd',
			version: 0,
			flags: 1,
			graphicsMode: 0x8040,
			opColor: [0x8001, 0x8002, 0x8003],
		}

		assert.deepStrictEqual(readIsoBoxes(bytes, { readers: { vmhd: readVmhd } }), [box])
		assert.deepStrictEqual(writeIsoBox(box, { writers: { vmhd: writeVmhd } }), bytes)
	})

	it('should throw a RangeError for a write with a missing opColor entry', function () {
		const box = { type: 'vmhd', version: 0, flags: 1, graphicsMode: 0, opColor: [1, 2] }

		assert.throws(
			// A box with a `type` of the type `string` needs a cast.
			() => writeIsoBox(box as never, { writers: { vmhd: writeVmhd } }),
			/^RangeError: .*writeUint16.* received undefined$/,
		)
	})
})
