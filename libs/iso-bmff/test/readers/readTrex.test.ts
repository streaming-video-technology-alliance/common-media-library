import {
	assert,
	describe,
	filterBoxes,
	it,
	readIsoBoxes,
	readTrex,
	writeIsoBox,
	writeTrex,
	type TrackExtendsBox,
} from '../util/box.ts'
import { boxBytes } from '../util/wideBoxes.ts'

describe('readTrex', function () {
	it('should correctly parse the box', function () {
		const boxes = filterBoxes('test_frag.mp4', 'trex', { readers: { trex: readTrex } })

		assert.strictEqual(boxes.length, 2)

		assert.strictEqual(boxes[0].type, 'trex')
		assert.strictEqual(boxes[0].trackId, 1)
		assert.strictEqual(boxes[0].defaultSampleDescriptionIndex, 1)
		assert.strictEqual(boxes[0].defaultSampleDuration, 0)
		assert.strictEqual(boxes[0].defaultSampleSize, 0)
		assert.strictEqual(boxes[0].defaultSampleFlags, 0)

		assert.strictEqual(boxes[1].type, 'trex')
		assert.strictEqual(boxes[1].trackId, 2)
		assert.strictEqual(boxes[1].defaultSampleDescriptionIndex, 1)
		assert.strictEqual(boxes[1].defaultSampleDuration, 0)
		assert.strictEqual(boxes[1].defaultSampleSize, 0)
		assert.strictEqual(boxes[1].defaultSampleFlags, 0)
	})

	it('should read a distinct value in each field and write the same bytes', function () {
		// Each value has the top bit set, so a signed read gives a negative number.
		const bytes = boxBytes(
			'trex',
			[0, 4],
			[0x80000001, 4],
			[0x80000002, 4],
			[0x80000003, 4],
			[0x80000004, 4],
			[0x80000005, 4],
		)
		const box: TrackExtendsBox = {
			type: 'trex',
			version: 0,
			flags: 0,
			trackId: 0x80000001,
			defaultSampleDescriptionIndex: 0x80000002,
			defaultSampleDuration: 0x80000003,
			defaultSampleSize: 0x80000004,
			defaultSampleFlags: 0x80000005,
		}

		assert.deepStrictEqual(readIsoBoxes(bytes, { readers: { trex: readTrex } }), [box])
		assert.deepStrictEqual(writeIsoBox(box, { writers: { trex: writeTrex } }), bytes)
	})
})
