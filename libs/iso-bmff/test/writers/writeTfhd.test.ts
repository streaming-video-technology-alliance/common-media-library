import { writeIsoBox, writeTfhd, type TrackFragmentHeaderBox } from '@svta/cml-iso-bmff'
import assert from 'node:assert'
import { describe, it } from 'vite-plus/test'
import { boxBytes } from '../util/wideBoxes.ts'
import { writeWith } from '../util/writeWith.ts'

describe('writeTfhd', function () {
	it('should write the fields that the flags name', function () {
		// #region example
		// The flags 0x020038 are default-base-is-moof, and the three default sample fields.
		const bytes = writeIsoBox(
			{
				type: 'tfhd',
				version: 0,
				flags: 0x020038,
				trackId: 1,
				defaultSampleDuration: 1000,
				defaultSampleSize: 687,
				defaultSampleFlags: 0x02000000,
			},
			{ writers: { tfhd: writeTfhd } },
		)
		// #endregion example

		assert.deepStrictEqual(
			bytes,
			new Uint8Array([
				0x00,
				0x00,
				0x00,
				0x1c, // size = 28
				0x74,
				0x66,
				0x68,
				0x64, // 'tfhd'
				0x00, // version = 0
				0x02,
				0x00,
				0x38, // flags = 0x020038
				0x00,
				0x00,
				0x00,
				0x01, // track_ID = 1
				0x00,
				0x00,
				0x03,
				0xe8, // default_sample_duration = 1000
				0x00,
				0x00,
				0x02,
				0xaf, // default_sample_size = 687
				0x02,
				0x00,
				0x00,
				0x00, // default_sample_flags = 0x02000000
			]),
		)
	})

	it('should write a distinct value in each field for the flags 0x00003b', function () {
		const bytes = writeWith(writeTfhd, {
			type: 'tfhd',
			version: 0,
			flags: 0x3b,
			trackId: 1,
			baseDataOffset: 2,
			sampleDescriptionIndex: 3,
			defaultSampleDuration: 4,
			defaultSampleSize: 5,
			defaultSampleFlags: 6,
		})

		assert.deepStrictEqual(
			bytes,
			boxBytes('tfhd', [0, 1], [0x3b, 3], [1, 4], [2, 8], [3, 4], [4, 4], [5, 4], [6, 4]),
		)
	})

	// Each line: a field that the flags 0x00003b name, and the field function that writes it.
	for (const [field, name] of [
		['baseDataOffset', 'writeWideUint'],
		['sampleDescriptionIndex', 'writeUint32'],
		['defaultSampleDuration', 'writeUint32'],
		['defaultSampleSize', 'writeUint32'],
		['defaultSampleFlags', 'writeUint32'],
	] as const) {
		it(`should throw a RangeError when the flags name ${field} and the box has no value`, function () {
			const box: TrackFragmentHeaderBox = {
				type: 'tfhd',
				version: 0,
				flags: 0x3b,
				trackId: 1,
				baseDataOffset: 2,
				sampleDescriptionIndex: 3,
				defaultSampleDuration: 4,
				defaultSampleSize: 5,
				defaultSampleFlags: 6,
				[field]: undefined,
			}

			assert.throws(
				() => writeWith(writeTfhd, box),
				new RegExp(`^RangeError: .*${name}.* received undefined$`),
			)
		})
	}

	it('should not write a field that the flags do not name', function () {
		const bytes = writeWith(writeTfhd, {
			type: 'tfhd',
			version: 0,
			flags: 0,
			trackId: 1,
			baseDataOffset: 2,
			sampleDescriptionIndex: 3,
			defaultSampleDuration: 4,
			defaultSampleSize: 5,
			defaultSampleFlags: 6,
		})

		assert.deepStrictEqual(bytes, boxBytes('tfhd', [0, 1], [0, 3], [1, 4]))
	})
})
