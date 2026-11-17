import {
	assert,
	describe,
	it,
	readIsoBoxes,
	readVlab,
	type WebVttSourceLabelBox,
} from '../util/box.ts'

describe('readVlab', function () {
	it('should read a WebVttSourceLabelBox correctly', function () {
		// #region example
		// size (14), type (vlab), sourceLabel
		const data = new Uint8Array([0, 0, 0, 14, 118, 108, 97, 98, 115, 111, 117, 114, 99, 101])

		const boxes = readIsoBoxes(data, { readers: { vlab: readVlab } })

		assert.strictEqual((boxes[0] as WebVttSourceLabelBox).sourceLabel, 'source')
		// #endregion example
	})

	it('should read a box that has a null byte after the sourceLabel', function () {
		// size (15), type (vlab), sourceLabel, null byte
		const data = new Uint8Array([0, 0, 0, 15, 118, 108, 97, 98, 115, 111, 117, 114, 99, 101, 0])

		const boxes = readIsoBoxes(data, { readers: { vlab: readVlab } })

		assert.strictEqual((boxes[0] as WebVttSourceLabelBox).sourceLabel, 'source')
	})
})
