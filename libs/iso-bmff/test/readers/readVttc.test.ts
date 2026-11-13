import {
	assert,
	describe,
	findBox,
	it,
	readIsoBoxes,
	readMdat,
	readPayl,
	readVttc,
} from '../util/box.ts'

describe('readVttc', function () {
	it('should correctly parse the box from sample data', function () {
		const { data } = findBox('webvtt.m4s', 'mdat', { readers: { mdat: readMdat } })
		const boxes = readIsoBoxes(data, { readers: { vttc: readVttc, payl: readPayl } })
		const box = boxes[0]

		assert.strictEqual(box.type, 'vttc')
		assert.strictEqual(box.boxes.length, 1)
		assert.strictEqual(box.boxes[0].type, 'payl')
	})
})
