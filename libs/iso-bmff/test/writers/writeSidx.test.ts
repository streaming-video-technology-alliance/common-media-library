import { writeWith } from '../util/writeWith.ts'
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
import { boxBytes } from '../util/wideBoxes.ts'

describe('writeSidx', function () {
	for (const version of [0, 1, 2]) {
		it(`should write the source bytes after a read of a version ${version} box`, function () {
			const source = sidxBox(version)
			const [box] = readIsoBoxes(source, { readers: { sidx: readSidx } })

			assert.ok(isIsoBoxType('sidx', box))
			assert.deepStrictEqual(new Uint8Array(writeWith(writeSidx, box).buffer), source)
		})
	}

	it('should write 64-bit fields for a version 2 box', function () {
		const writer = writeWith(writeSidx, {
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

	it('should write a reference that does not start with a SAP', function () {
		const bytes = writeWith(writeSidx, {
			type: 'sidx',
			version: 0,
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
					startsWithSap: 0,
					sapType: 3,
					sapDeltaTime: 5,
				},
			],
		})

		// The last word has starts_with_SAP (1 bit, 0), SAP_type (3 bits, 3), and SAP_delta_time (28 bits, 5).
		assert.deepStrictEqual(
			bytes,
			boxBytes(
				'sidx',
				[0, 1],
				[0, 3],
				[1, 4],
				[2, 4],
				[3, 4],
				[4, 4],
				[0, 2],
				[1, 2],
				[100, 4],
				[5, 4],
				[0x30000005, 4],
			),
		)
	})

	it('should throw a RangeError for more than 65535 references', function () {
		const reference = {
			referenceType: 0,
			referencedSize: 1,
			subsegmentDuration: 1,
			startsWithSap: 0,
			sapType: 0,
			sapDeltaTime: 0,
		}

		assert.throws(
			() =>
				writeWith(writeSidx, {
					type: 'sidx',
					version: 0,
					flags: 0,
					referenceId: 1,
					timescale: 1,
					earliestPresentationTime: 0,
					firstOffset: 0,
					references: Array.from({ length: 65536 }, () => reference),
				}),
			{ name: 'RangeError', message: 'The sidx box has 65536 references, and the limit is 65535' },
		)
	})
})
