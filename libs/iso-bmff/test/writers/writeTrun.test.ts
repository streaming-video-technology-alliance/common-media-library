import { writeWith } from '../util/writeWith.ts'
import {
	assert,
	isIsoBoxType,
	describe,
	it,
	readIsoBoxes,
	readTrun,
	writeTrun,
	type TrackRunBox,
} from '../util/box.ts'
import { trunBox } from '../util/versionBoxes.ts'
import { boxBytes } from '../util/wideBoxes.ts'

describe('writeTrun', function () {
	for (const version of [0, 1, 2]) {
		it(`should write the source bytes after a read of a version ${version} box`, function () {
			const source = trunBox(version)
			const [box] = readIsoBoxes(source, { readers: { trun: readTrun } })

			assert.ok(isIsoBoxType('trun', box))
			assert.deepStrictEqual(new Uint8Array(writeWith(writeTrun, box).buffer), source)
		})
	}

	it('should write a negative data offset and composition time offset as signed fields', function () {
		const writer = writeWith(writeTrun, {
			type: 'trun',
			version: 1,
			flags: 0x801,
			dataOffset: -8,
			samples: [{ sampleCompositionTimeOffset: -1 }],
		})
		const bytes = new Uint8Array(writer.buffer)
		const [box] = readIsoBoxes(bytes, { readers: { trun: readTrun } })

		assert.deepStrictEqual(
			bytes,
			boxBytes('trun', [1, 1], [0x801, 3], [1, 4], [0xfffffff8, 4], [0xffffffff, 4]),
		)
		assert.ok(isIsoBoxType('trun', box))
		assert.strictEqual(box.dataOffset, -8)
		assert.strictEqual(box.samples[0].sampleCompositionTimeOffset, -1)
	})

	it('should keep the bytes of a version 0 composition time offset above 2^31', function () {
		const writer = writeWith(writeTrun, {
			type: 'trun',
			version: 0,
			flags: 0x800,
			samples: [{ sampleCompositionTimeOffset: 3_000_000_000 }],
		})

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			boxBytes('trun', [0, 1], [0x800, 3], [1, 4], [0xb2d05e00, 4]),
		)
	})

	it('should write the length of samples as the sample count', function () {
		const bytes = writeWith(writeTrun, {
			type: 'trun',
			version: 0,
			flags: 0x100,
			samples: [{ sampleDuration: 1 }, { sampleDuration: 2 }],
		})

		assert.deepStrictEqual(bytes, boxBytes('trun', [0, 1], [0x100, 3], [2, 4], [1, 4], [2, 4]))
	})

	it('should write each field that the flags 0x000f05 name', function () {
		const bytes = writeWith(writeTrun, {
			type: 'trun',
			version: 0,
			flags: 0xf05,
			dataOffset: 1,
			firstSampleFlags: 2,
			samples: [
				{ sampleDuration: 3, sampleSize: 4, sampleFlags: 5, sampleCompositionTimeOffset: 6 },
			],
		})

		assert.deepStrictEqual(
			bytes,
			boxBytes('trun', [0, 1], [0xf05, 3], [1, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4]),
		)
	})

	// The flags 0x000f05 name data_offset, first_sample_flags, and the four sample fields.
	for (const [field, name] of [
		['dataOffset', 'writeInt32'],
		['firstSampleFlags', 'writeUint32'],
	] as const) {
		it(`should throw a RangeError when the flags name ${field} and the box has no value`, function () {
			const box: TrackRunBox = {
				type: 'trun',
				version: 0,
				flags: 0xf05,
				dataOffset: 1,
				firstSampleFlags: 2,
				[field]: undefined,
				samples: [
					{ sampleDuration: 3, sampleSize: 4, sampleFlags: 5, sampleCompositionTimeOffset: 6 },
				],
			}

			assert.throws(
				() => writeWith(writeTrun, box),
				new RegExp(`^RangeError: .*${name}.* received undefined$`),
			)
		})
	}

	for (const field of [
		'sampleDuration',
		'sampleSize',
		'sampleFlags',
		'sampleCompositionTimeOffset',
	] as const) {
		it(`should throw a RangeError when the flags name ${field} and a sample has no value`, function () {
			const box: TrackRunBox = {
				type: 'trun',
				version: 0,
				flags: 0xf05,
				dataOffset: 1,
				firstSampleFlags: 2,
				samples: [
					{
						sampleDuration: 3,
						sampleSize: 4,
						sampleFlags: 5,
						sampleCompositionTimeOffset: 6,
						[field]: undefined,
					},
				],
			}

			assert.throws(
				() => writeWith(writeTrun, box),
				/^RangeError: .*writeUint32.* received undefined$/,
			)
		})
	}

	it('should throw a RangeError for a negative composition time offset of a version 0 box', function () {
		assert.throws(
			() =>
				writeWith(writeTrun, {
					type: 'trun',
					version: 0,
					flags: 0x800,
					samples: [{ sampleCompositionTimeOffset: -1 }],
				}),
			/^RangeError: .*writeUint32.* received -1$/,
		)
	})

	it('should not write a field that the flags do not name', function () {
		const bytes = writeWith(writeTrun, {
			type: 'trun',
			version: 0,
			flags: 0,
			dataOffset: 1,
			firstSampleFlags: 2,
			samples: [
				{ sampleDuration: 3, sampleSize: 4, sampleFlags: 5, sampleCompositionTimeOffset: 6 },
			],
		})

		assert.deepStrictEqual(bytes, boxBytes('trun', [0, 1], [0, 3], [1, 4]))
	})
})
