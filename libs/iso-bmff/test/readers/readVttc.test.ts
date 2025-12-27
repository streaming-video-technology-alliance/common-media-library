import { assert, describe, findBox, it, readMdat, readIsoBoxes } from '../util/box.ts'

describe('readVttc', function () {
	it('should correctly parse the box from sample data', function () {
		const { data } = findBox('webvtt.m4s', readMdat)
		const boxes = readIsoBoxes(data)
		assert.strictEqual(boxes[0].type, 'vttc')
	})
})
