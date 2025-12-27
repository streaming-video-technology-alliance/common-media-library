import { assert, describe, findBox, readIden, it, readMdat, readIsoBoxes, type ContainerBox, type WebVttCueIdBox } from '../util/box.ts'

describe('readIden', function () {
	it('should correctly parse the box from sample data', function () {
		const { data } = findBox('vttc.mp4', readMdat)
		const boxes = readIsoBoxes(data, { readers: { iden: readIden } }) as unknown as ContainerBox<WebVttCueIdBox>[]
		assert.strictEqual(boxes[0].boxes[0].cueId, '70')
	})
})
