import { assert, describe, findBox, it, mdat, readIsoBoxes, vtte } from './util/box.ts'

describe('vtte box', function () {
	it('should correctly parse the box from sample data', function () {
		const { data } = findBox('webvtt.m4s', mdat)
		const boxes = readIsoBoxes(data, { readers: { vtte } })
		assert.strictEqual(boxes[1].type, 'vtte')
	})
})

