import { assert, describe, findBox, it, readIsoBoxes, readMdat } from '../util/box.ts'

describe('readVttc', function () {
	it('should correctly parse the box from sample data', function () {
		const { data } = findBox('webvtt.m4s', 'mdat', { mdat: readMdat })
		const boxes = readIsoBoxes(data)
		assert.strictEqual(boxes[0].type, 'vttc')
	})
})
