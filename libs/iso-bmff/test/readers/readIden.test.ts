import { assert, describe, findBox, isContainer, it, readIden, readIsoBoxes, readMdat } from '../util/box.ts'

describe('readIden', function () {
	it('should correctly parse the box from sample data', function () {
		const { data } = findBox('vttc.mp4', 'mdat', { readers: { mdat: readMdat } })
		const boxes = readIsoBoxes(data, { readers: { iden: readIden } })
		assert(isContainer(boxes[0]))
		assert.strictEqual(boxes[0].boxes[0].cueId, '70')
	})
})
