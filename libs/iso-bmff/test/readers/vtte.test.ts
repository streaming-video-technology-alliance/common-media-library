import { assert, describe, findBox, it, readMdat, readIsoBoxes, readVtte } from '../util/box.ts'

describe('readVtte', function () {
	it('should correctly parse the box from sample data', function () {
		const { data } = findBox('webvtt.m4s', readMdat)
		const boxes = readIsoBoxes(data, { readers: { vtte: readVtte } })
		assert.strictEqual(boxes[1].type, 'vtte')
	})
})

