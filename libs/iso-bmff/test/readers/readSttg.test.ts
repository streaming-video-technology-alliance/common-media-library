import { assert, describe, findBox, it, readMdat, readIsoBoxes, readSttg, type ContainerBox, type WebVttSettingsBox } from '../util/box.ts'

describe('readSttg', function () {
	it('should correctly parse the box from sample data', function () {
		const { data } = findBox('vttc.mp4', readMdat)
		const boxes = readIsoBoxes(data, { readers: { sttg: readSttg } }) as ContainerBox<WebVttSettingsBox>[]
		assert.strictEqual(boxes[1].boxes[1].settings, 'align:left line:89% position:25% size:65%')
	})
})
