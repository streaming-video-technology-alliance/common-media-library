import { assert, describe, findBox, it, readMdat, readPayl, readIsoBoxes, type ContainerBox, type WebVttCuePayloadBox } from '../util/box.ts'

describe('readPayl', function () {
	it('should correctly parse the box from sample data', function () {
		const { data } = findBox('webvtt.m4s', readMdat)
		const boxes = readIsoBoxes(data, { readers: { payl: readPayl } }) as ContainerBox<WebVttCuePayloadBox>[]
		const box = boxes[0].boxes?.[0]

		assert.ok(box)
		assert.strictEqual(box.type, 'payl')
		assert.strictEqual(box.cueText, "You're a jerk, Thom.\n")
	})
})
