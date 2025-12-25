import { assert, describe, findBox, it, mdat, payl, readIsoBoxes, type ContainerBox, type WebVttCuePayloadBox } from './util/box.ts'

describe('payl box', function () {
	it('should correctly parse the box from sample data', function () {
		const { data } = findBox('webvtt.m4s', mdat)
		const boxes = readIsoBoxes(data, { readers: { payl } }) as ContainerBox<WebVttCuePayloadBox>[]
		const box = boxes[0].boxes?.[0]

		assert.ok(box)
		assert.strictEqual(box.type, 'payl')
		assert.strictEqual(box.cueText, "You're a jerk, Thom.\n")
	})
})
