import {
	assert,
	describe,
	findBox,
	it,
	readIsoBoxes,
	readMdhd,
	writeIsoBox,
	writeMdhd,
	type MediaHeaderBox,
} from '../util/box.ts'
import { boxBytes } from '../util/wideBoxes.ts'

describe('readMdhd', function () {
	it('should correctly parse the box from sample data', function () {
		const box = findBox('captions.mp4', 'mdhd', { readers: { mdhd: readMdhd } })

		assert.strictEqual(box.creationTime, 3507186411)
		assert.strictEqual(box.modificationTime, 3507186411)
		assert.strictEqual(box.timescale, 1000)
		assert.strictEqual(box.duration, 629800)
		assert.strictEqual(box.language, 'und')
		assert.strictEqual(box.preDefined, 0)
	})

	it('should read a distinct value in each field and write the same bytes', function () {
		// timescale and pre_defined have the top bit set, so a signed read gives a negative number.
		// 0x15c7 is the packed language code of 'eng'.
		const bytes = boxBytes(
			'mdhd',
			[0, 4],
			[1, 4],
			[2, 4],
			[0x80000003, 4],
			[4, 4],
			[0x15c7, 2],
			[0x8005, 2],
		)
		const box: MediaHeaderBox = {
			type: 'mdhd',
			version: 0,
			flags: 0,
			creationTime: 1,
			modificationTime: 2,
			timescale: 0x80000003,
			duration: 4,
			language: 'eng',
			preDefined: 0x8005,
		}

		assert.deepStrictEqual(readIsoBoxes(bytes, { readers: { mdhd: readMdhd } }), [box])
		assert.deepStrictEqual(writeIsoBox(box, { writers: { mdhd: writeMdhd } }), bytes)
	})
})
