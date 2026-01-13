import { assert, describe, findBox, isContainer, it, readIsoBoxes, readMdat, readSttg } from '../util/box.ts'

describe('readSttg', function () {
	it('should correctly parse the box from sample data', function () {
		const { data } = findBox('vttc.mp4', 'mdat', { readers: { mdat: readMdat } })
		const boxes = readIsoBoxes(data, { readers: { sttg: readSttg } })
		assert(isContainer(boxes[1]))
		assert.strictEqual(boxes[1].boxes[1].settings, 'align:left line:89% position:25% size:65%')
	})
})
