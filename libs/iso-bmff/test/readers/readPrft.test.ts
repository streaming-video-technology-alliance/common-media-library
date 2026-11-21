import {
	assert,
	describe,
	filterBoxes,
	isIsoBoxType,
	it,
	readIsoBoxes,
	readPrft,
} from '../util/box.ts'
import { prftBox } from '../util/versionBoxes.ts'

describe('readPrft', function () {
	it('should correctly parse the box from sample data', function () {
		const boxes = filterBoxes('dash-chunks-prft.m4s', 'prft', { readers: { prft: readPrft } })
		assert.strictEqual(boxes.length, 60)
		assert.ok(isIsoBoxType('prft', boxes[0]))
		assert.strictEqual(boxes[0].referenceTrackId, 1)
		assert.strictEqual(boxes[0].ntpTimestampSec, 3879495203)
		assert.strictEqual(boxes[0].ntpTimestampFrac, 197568495)
		assert.strictEqual(boxes[0].mediaTime, 1355974620)
	})
})

describe('readPrft versions', function () {
	for (const version of [0, 1, 2]) {
		it(`should read the fields of a version ${version} box`, function () {
			const [box] = readIsoBoxes(prftBox(version), { readers: { prft: readPrft } })

			assert.ok(isIsoBoxType('prft', box))
			assert.strictEqual(box.version, version)
			assert.strictEqual(box.referenceTrackId, 1)
			assert.strictEqual(box.ntpTimestampSec, 2)
			assert.strictEqual(box.ntpTimestampFrac, 3)
			assert.strictEqual(box.mediaTime, 4)
		})
	}
})
