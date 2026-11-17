import {
	assert,
	describe,
	findBox,
	isContainer,
	it,
	readIsoBoxes,
	readMdat,
	readSttg,
	type WebVttSettingsBox,
} from '../util/box.ts'

describe('readSttg', function () {
	it('should correctly parse the box from sample data', function () {
		const { data } = findBox('vttc.mp4', 'mdat', { readers: { mdat: readMdat } })
		const boxes = readIsoBoxes(data, { readers: { sttg: readSttg } })
		assert(isContainer(boxes[1]))
		assert.strictEqual(
			(boxes[1].boxes[1] as WebVttSettingsBox).settings,
			'align:left line:89% position:25% size:65%',
		)
	})

	it('should read a box that has a null byte after the settings', function () {
		// size (20), type (sttg), settings, null byte
		const data = new Uint8Array([
			0, 0, 0, 20, 115, 116, 116, 103, 97, 108, 105, 103, 110, 58, 115, 116, 97, 114, 116, 0,
		])

		const boxes = readIsoBoxes(data, { readers: { sttg: readSttg } })

		assert.strictEqual((boxes[0] as WebVttSettingsBox).settings, 'align:start')
	})
})
