import {
	assert,
	isIsoBoxType,
	describe,
	it,
	readIsoBoxes,
	readSidx,
	writeSidx,
} from '../util/box.ts'
import { sidxBox } from '../util/versionBoxes.ts'

describe('writeSidx', function () {
	for (const version of [0, 1, 2]) {
		it(`should write the source bytes after a read of a version ${version} box`, function () {
			const source = sidxBox(version)
			const [box] = readIsoBoxes(source, { readers: { sidx: readSidx } })

			assert.ok(isIsoBoxType('sidx', box))
			assert.deepStrictEqual(new Uint8Array(writeSidx(box).buffer), source)
		})
	}

	it('should write 64-bit fields for a version 2 box', function () {
		const writer = writeSidx({
			type: 'sidx',
			version: 2,
			flags: 0,
			referenceId: 1,
			timescale: 2,
			earliestPresentationTime: 3,
			firstOffset: 4,
			references: [
				{
					subsegmentDuration: 5,
					referenceType: 0,
					referencedSize: 100,
					startsWithSap: 1,
					sapType: 1,
					sapDeltaTime: 0,
				},
			],
		})

		assert.deepStrictEqual(new Uint8Array(writer.buffer), sidxBox(2))
	})
})
