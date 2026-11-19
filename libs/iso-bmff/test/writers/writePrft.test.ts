import { writeWith } from '../util/writeWith.ts'
import {
	assert,
	isIsoBoxType,
	describe,
	it,
	readIsoBoxes,
	readPrft,
	writePrft,
} from '../util/box.ts'
import { prftBox } from '../util/versionBoxes.ts'

describe('writePrft', function () {
	for (const version of [0, 1, 2]) {
		it(`should write the source bytes after a read of a version ${version} box`, function () {
			const source = prftBox(version)
			const [box] = readIsoBoxes(source, { readers: { prft: readPrft } })

			assert.ok(isIsoBoxType('prft', box))
			assert.deepStrictEqual(new Uint8Array(writeWith(writePrft, box).buffer), source)
		})
	}

	it('should write a 64-bit media_time for a version 2 box', function () {
		const writer = writeWith(writePrft, {
			type: 'prft',
			version: 2,
			flags: 0,
			referenceTrackId: 1,
			ntpTimestampSec: 2,
			ntpTimestampFrac: 3,
			mediaTime: 4,
		})

		assert.deepStrictEqual(new Uint8Array(writer.buffer), prftBox(2))
	})
})
