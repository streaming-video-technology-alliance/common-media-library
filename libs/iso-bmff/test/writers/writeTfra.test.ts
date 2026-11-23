import { writeWith } from '../util/writeWith.ts'
import {
	assert,
	describe,
	isIsoBoxType,
	it,
	readIsoBoxes,
	readTfra,
	writeTfra,
	type TrackFragmentRandomAccessBox,
} from '../util/box.ts'
import { boxBytes } from '../util/wideBoxes.ts'

describe('writeTfra', function () {
	it('should write each number with its length size and read back the same entries', function () {
		const box: TrackFragmentRandomAccessBox = {
			type: 'tfra',
			version: 0,
			flags: 0,
			trackId: 1,
			lengthSizeOfTrafNum: 0,
			lengthSizeOfTrunNum: 1,
			lengthSizeOfSampleNum: 3,
			entries: [{ time: 100, moofOffset: 200, trafNumber: 1, trunNumber: 2, sampleNumber: 3 }],
		}
		const bytes = writeWith(writeTfra, box)
		const [read] = readIsoBoxes(bytes, { readers: { tfra: readTfra } })

		assert.deepStrictEqual(
			bytes,
			boxBytes(
				'tfra',
				[0, 1],
				[0, 3],
				[1, 4],
				[0b000111, 4],
				[1, 4],
				[100, 4],
				[200, 4],
				[1, 1],
				[2, 2],
				[3, 4],
			),
		)
		assert.ok(isIsoBoxType('tfra', read))
		assert.deepStrictEqual(read.entries, box.entries)
	})

	it('should write each number in 3 bytes for the length size 2', function () {
		const bytes = writeWith(writeTfra, {
			type: 'tfra',
			version: 0,
			flags: 0,
			trackId: 1,
			lengthSizeOfTrafNum: 2,
			lengthSizeOfTrunNum: 2,
			lengthSizeOfSampleNum: 2,
			entries: [
				{
					time: 100,
					moofOffset: 200,
					trafNumber: 0x010203,
					trunNumber: 0x040506,
					sampleNumber: 0x070809,
				},
			],
		})

		assert.deepStrictEqual(
			bytes,
			boxBytes(
				'tfra',
				[0, 1],
				[0, 3],
				[1, 4],
				[0b101010, 4],
				[1, 4],
				[100, 4],
				[200, 4],
				[0x010203, 3],
				[0x040506, 3],
				[0x070809, 3],
			),
		)
	})

	it('should read each number from 3 bytes for the length size 2', function () {
		const bytes = boxBytes(
			'tfra',
			[0, 1],
			[0, 3],
			[1, 4],
			[0b101010, 4],
			[1, 4],
			[100, 4],
			[200, 4],
			[0x010203, 3],
			[0x040506, 3],
			[0x070809, 3],
		)
		const [read] = readIsoBoxes(bytes, { readers: { tfra: readTfra } })

		assert.ok(isIsoBoxType('tfra', read))
		assert.deepStrictEqual(read.entries, [
			{
				time: 100,
				moofOffset: 200,
				trafNumber: 0x010203,
				trunNumber: 0x040506,
				sampleNumber: 0x070809,
			},
		])
	})

	it('should write the largest length size 3 in each of the three fields', function () {
		const bytes = writeWith(writeTfra, {
			type: 'tfra',
			version: 0,
			flags: 0,
			trackId: 1,
			lengthSizeOfTrafNum: 3,
			lengthSizeOfTrunNum: 3,
			lengthSizeOfSampleNum: 3,
			entries: [{ time: 100, moofOffset: 200, trafNumber: 1, trunNumber: 2, sampleNumber: 3 }],
		})

		assert.deepStrictEqual(
			bytes,
			boxBytes(
				'tfra',
				[0, 1],
				[0, 3],
				[1, 4],
				[0b111111, 4],
				[1, 4],
				[100, 4],
				[200, 4],
				[1, 4],
				[2, 4],
				[3, 4],
			),
		)
	})

	for (const field of [
		'lengthSizeOfTrafNum',
		'lengthSizeOfTrunNum',
		'lengthSizeOfSampleNum',
	] as const) {
		it(`should throw a RangeError for a ${field} of 4`, function () {
			const box: TrackFragmentRandomAccessBox = {
				type: 'tfra',
				version: 0,
				flags: 0,
				trackId: 1,
				lengthSizeOfTrafNum: 0,
				lengthSizeOfTrunNum: 0,
				lengthSizeOfSampleNum: 0,
				[field]: 4,
				entries: [],
			}

			assert.throws(
				() => writeWith(writeTfra, box),
				new RegExp(`^RangeError: .*${field}.* received 4$`),
			)
		})
	}

	it('should throw a RangeError for a number that does not fit its length size', function () {
		assert.throws(
			() =>
				writeWith(writeTfra, {
					type: 'tfra',
					version: 0,
					flags: 0,
					trackId: 1,
					lengthSizeOfTrafNum: 0,
					lengthSizeOfTrunNum: 0,
					lengthSizeOfSampleNum: 0,
					entries: [{ time: 0, moofOffset: 0, trafNumber: 256, trunNumber: 1, sampleNumber: 1 }],
				}),
			/^RangeError: .*writeUint8.* received 256$/,
		)
	})
})
