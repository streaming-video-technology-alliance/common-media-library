import { readIsoBoxes, readTfhd } from '@svta/cml-iso-bmff'
import assert from 'node:assert'
import { describe, it } from 'vite-plus/test'
import { boxBytes } from '../util/wideBoxes.ts'

describe('readTfhd', function () {
	it('should read the fields that the flags name', function () {
		// #region example
		// A tfhd box with the flags 0x020038: default-base-is-moof, and the three default sample fields.
		const bytes = new Uint8Array([
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
		])
		const [tfhd] = readIsoBoxes(bytes, { readers: { tfhd: readTfhd } })
		// #endregion example

		assert.deepStrictEqual(tfhd, {
			type: 'tfhd',
			version: 0,
			flags: 0x020038,
			trackId: 1,
			baseDataOffset: undefined,
			sampleDescriptionIndex: undefined,
			defaultSampleDuration: 1000,
			defaultSampleSize: 687,
			defaultSampleFlags: 0x02000000,
		})
	})

	it('should read a distinct value in each field for the flags 0x00003b', function () {
		// Each 32-bit value has the top bit set, so a signed read gives a negative number.
		const bytes = boxBytes(
			'tfhd',
			[0, 1],
			[0x3b, 3],
			[0x80000001, 4],
			[2, 8],
			[0x80000003, 4],
			[0x80000004, 4],
			[0x80000005, 4],
			[0x80000006, 4],
		)
		const [tfhd] = readIsoBoxes(bytes, { readers: { tfhd: readTfhd } })

		assert.deepStrictEqual(tfhd, {
			type: 'tfhd',
			version: 0,
			flags: 0x3b,
			trackId: 0x80000001,
			baseDataOffset: 2,
			sampleDescriptionIndex: 0x80000003,
			defaultSampleDuration: 0x80000004,
			defaultSampleSize: 0x80000005,
			defaultSampleFlags: 0x80000006,
		})
	})

	it('should set each field that the flags do not name to undefined', function () {
		const [tfhd] = readIsoBoxes(boxBytes('tfhd', [0, 1], [0, 3], [1, 4]), {
			readers: { tfhd: readTfhd },
		})

		assert.deepStrictEqual(tfhd, {
			type: 'tfhd',
			version: 0,
			flags: 0,
			trackId: 1,
			baseDataOffset: undefined,
			sampleDescriptionIndex: undefined,
			defaultSampleDuration: undefined,
			defaultSampleSize: undefined,
			defaultSampleFlags: undefined,
		})
	})
})
