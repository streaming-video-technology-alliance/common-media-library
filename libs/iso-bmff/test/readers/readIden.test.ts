import {
	assert,
	describe,
	findBox,
	isContainer,
	it,
	readIden,
	readIsoBoxes,
	readMdat,
	type WebVttCueIdBox,
} from '../util/box.ts'

describe('readIden', function () {
	it('should correctly parse the box from sample data', function () {
		const { data } = findBox('vttc.mp4', 'mdat', { readers: { mdat: readMdat } })
		const boxes = readIsoBoxes(data, { readers: { iden: readIden } })
		assert(isContainer(boxes[0]))
		assert.strictEqual((boxes[0].boxes[0] as WebVttCueIdBox).cueId, '70')
	})

	it('should read a box that has a null byte after the cueId', function () {
		// size (14), type (iden), cueId, null byte
		const data = new Uint8Array([0, 0, 0, 14, 105, 100, 101, 110, 99, 117, 101, 45, 49, 0])

		const boxes = readIsoBoxes(data, { readers: { iden: readIden } })

		assert.strictEqual((boxes[0] as WebVttCueIdBox).cueId, 'cue-1')
	})
})
