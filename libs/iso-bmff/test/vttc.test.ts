import { assert, describe, findBox, it, mdat, readIsoBoxes } from './util/box.ts'

describe('vttc box', function () {
	it('should correctly parse the box from sample data', function () {
		const { data } = findBox('webvtt.m4s', mdat)
		const boxes = readIsoBoxes(data)
		assert.strictEqual(boxes[0].type, 'vttc')
	})
})
