import {
	assert,
	describe,
	filterBoxes,
	isIsoBoxType,
	it,
	readCtts,
	readIsoBoxes,
} from '../util/box.ts'
import { cttsBox } from '../util/versionBoxes.ts'

describe('readCtts', function () {
	it('should correctly parse the box', function () {
		const boxes = filterBoxes('time_to_sample.mp4', 'ctts', { readers: { ctts: readCtts } })
		const box = boxes[0]

		assert.strictEqual(boxes.length, 1)

		assert.ok(isIsoBoxType('ctts', box))

		const { entries } = box
		assert.strictEqual(entries.length, 5)
		assert.strictEqual(entries[0].sampleCount, 1)
		assert.strictEqual(entries[0].sampleOffset, 1024)
		assert.strictEqual(entries[1].sampleCount, 1)
		assert.strictEqual(entries[1].sampleOffset, 2560)
		assert.strictEqual(entries[2].sampleCount, 1)
		assert.strictEqual(entries[2].sampleOffset, 1024)
		assert.strictEqual(entries[3].sampleCount, 1)
		assert.strictEqual(entries[3].sampleOffset, 0)
		assert.strictEqual(entries[4].sampleCount, 1)
		assert.strictEqual(entries[4].sampleOffset, 512)
	})
})

describe('readCtts versions', function () {
	it('should read an unsigned sample offset for a version 0 box', function () {
		const [box] = readIsoBoxes(cttsBox(0), { readers: { ctts: readCtts } })

		assert.ok(isIsoBoxType('ctts', box))
		assert.strictEqual(box.version, 0)
		assert.deepStrictEqual(box.entries, [{ sampleCount: 1, sampleOffset: 4294967294 }])
	})

	it('should read a signed sample offset for a version 1 box', function () {
		const [box] = readIsoBoxes(cttsBox(1), { readers: { ctts: readCtts } })

		assert.ok(isIsoBoxType('ctts', box))
		assert.strictEqual(box.version, 1)
		assert.deepStrictEqual(box.entries, [{ sampleCount: 1, sampleOffset: -2 }])
	})

	it('should read entry_count and no entries for a version 2 box', function () {
		const [box] = readIsoBoxes(cttsBox(2), { readers: { ctts: readCtts } })

		assert.ok(isIsoBoxType('ctts', box))
		assert.strictEqual(box.version, 2)
		assert.strictEqual(box.entryCount, 1)
		assert.deepStrictEqual(box.entries, [])
	})

	it('should have no entryCount for a version 0 or 1 box', function () {
		for (const version of [0, 1]) {
			const [box] = readIsoBoxes(cttsBox(version), { readers: { ctts: readCtts } })

			assert.ok(isIsoBoxType('ctts', box))
			assert.ok(!('entryCount' in box))
		}
	})
})
