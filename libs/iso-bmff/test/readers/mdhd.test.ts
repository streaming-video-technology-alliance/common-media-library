import { assert, describe, findBox, it, readMdhd, type MediaHeaderBox } from '../util/box.ts'

describe('readMdhd', function () {
	it('should correctly parse the box from sample data', function () {
		const box = findBox<MediaHeaderBox>('captions.mp4', [readMdhd])

		assert.strictEqual(box.creationTime, 3507186411)
		assert.strictEqual(box.modificationTime, 3507186411)
		assert.strictEqual(box.timescale, 1000)
		assert.strictEqual(box.duration, 629800)
		assert.strictEqual(box.language, 'und')
		assert.strictEqual(box.preDefined, 0)
	})
})
