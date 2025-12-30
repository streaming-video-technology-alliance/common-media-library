import { assert, describe, filterBoxes, it, readStsd, type AudioSampleEntryBox, type VisualSampleEntryBox, type VisualSampleEntryType } from '../util/box.ts'

describe('readStsd', function () {
	it('should correctly parse the box', function () {
		const boxes = filterBoxes('240fps_go_pro_hero_4.mp4', 'stsd', { stsd: readStsd })

		assert.strictEqual(boxes.length, 3)
		assert.strictEqual((boxes[0].entries[0] as VisualSampleEntryBox<'avc1'>).type, 'avc1')
		assert.strictEqual((boxes[1].entries[0] as AudioSampleEntryBox<'mp4a'>).type, 'mp4a')
		assert.strictEqual((boxes[2].entries[0] as VisualSampleEntryBox<VisualSampleEntryType>).type, 'fdsc')
	})
})
