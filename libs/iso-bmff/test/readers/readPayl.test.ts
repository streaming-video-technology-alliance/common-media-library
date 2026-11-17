import {
	assert,
	describe,
	findBox,
	isContainer,
	it,
	readIsoBoxes,
	readMdat,
	readPayl,
	type WebVttCuePayloadBox,
} from '../util/box.ts'

describe('readPayl', function () {
	it('should correctly parse the box from sample data', function () {
		const { data } = findBox('webvtt.m4s', 'mdat', { readers: { mdat: readMdat } })
		const boxes = readIsoBoxes(data, { readers: { payl: readPayl } })

		const container = boxes[0]
		assert(isContainer(container))

		const box = container.boxes[0] as WebVttCuePayloadBox

		assert.ok(box)
		assert.strictEqual(box.type, 'payl')
		assert.strictEqual(box.cueText, "You're a jerk, Thom.\n")
	})

	it('should read a box that has a null byte after the cueText', function () {
		// size (20), type (payl), cueText, null byte
		const data = new Uint8Array([
			0, 0, 0, 20, 112, 97, 121, 108, 72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 0,
		])

		const boxes = readIsoBoxes(data, { readers: { payl: readPayl } })

		assert.strictEqual((boxes[0] as WebVttCuePayloadBox).cueText, 'Hello world')
	})
})
