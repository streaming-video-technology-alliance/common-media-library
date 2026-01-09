import { assert, describe, findBox, isContainer, it, readIsoBoxes, readMdat, readPayl } from '../util/box.ts'

describe('readPayl', function () {
	it('should correctly parse the box from sample data', function () {
		const { data } = findBox('webvtt.m4s', 'mdat', { readers: { mdat: readMdat } })
		const boxes = readIsoBoxes(data, { readers: { payl: readPayl } })

		const container = boxes[0]
		assert(isContainer(container))

		const box = container.boxes[0]

		assert.ok(box)
		assert.strictEqual(box.type, 'payl')
		assert.strictEqual(box.cueText, "You're a jerk, Thom.\n")
	})
})
