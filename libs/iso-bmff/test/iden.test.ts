import type { ContainerBox } from '@svta/cml-iso-bmff'
import { assert, describe, findBox, iden, it, mdat, parseBoxes, type WebVttCueIdBox } from './util/box.ts'

describe('iden box', function () {
	it('should correctly parse the box from sample data', function () {
		const { data } = findBox('vttc.mp4', mdat)
		const boxes = parseBoxes(data, { parsers: { iden } }) as unknown as ContainerBox<WebVttCueIdBox>[]
		assert.strictEqual(boxes[0].boxes[0].cueId, '70')
	})
})
