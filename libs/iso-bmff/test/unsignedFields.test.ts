import { createDefaultReaderConfig, readIsoBoxes, readMfhd } from '@svta/cml-iso-bmff'
import assert from 'node:assert'
import { describe, it } from 'vite-plus/test'
import { boxBytes, valueAt, type BoxField } from './util/wideBoxes.ts'

// A 32-bit field with all bits set. An unsigned read gives 4294967295, and a signed read gives -1.
const ALL: BoxField = [0xffffffff, 4]

// A 32-bit count with the top bit set. An unsigned read gives 2147483648.
// A signed read gives a negative count.
const COUNT: BoxField = [0x80000000, 4]

// Each line: the name of the case, the bytes of the box, and the fields with all bits set.
const VALUES: [name: string, bytes: Uint8Array, paths: string[]][] = [
	['ctts', boxBytes('ctts', [0, 4], [1, 4], ALL, [1, 4]), ['entries.0.sampleCount']],
	[
		'emsg version 0',
		boxBytes('emsg', [0, 4], [0, 1], [0, 1], ALL, ALL, ALL, ALL),
		['timescale', 'presentationTimeDelta', 'eventDuration', 'id'],
	],
	[
		'emsg version 1',
		boxBytes('emsg', [1, 1], [0, 3], ALL, [0, 8], ALL, ALL, [0, 1], [0, 1]),
		['timescale', 'eventDuration', 'id'],
	],
	['ftyp', boxBytes('ftyp', [0x69736f6d, 4], ALL), ['minorVersion']],
	['imda', boxBytes('imda', ALL), ['imdaIdentifier']],
	['mfhd', boxBytes('mfhd', [0, 4], ALL), ['sequenceNumber']],
	['mfro', boxBytes('mfro', [0, 4], ALL), ['mfraSize']],
	[
		'mvhd',
		boxBytes('mvhd', [0, 4], [0, 4], [0, 4], ALL, new Uint8Array(80), ALL),
		['timescale', 'nextTrackId'],
	],
	[
		'prft',
		boxBytes('prft', [0, 4], ALL, ALL, ALL, [0, 4]),
		['referenceTrackId', 'ntpTimestampSec', 'ntpTimestampFrac'],
	],
	['prsl', boxBytes('prsl', [0, 4], ALL, [1, 4], ALL), ['groupId', 'entityId.0']],
	['schm', boxBytes('schm', [0, 4], [0x63656e63, 4], ALL), ['schemeVersion']],
	[
		'sidx',
		boxBytes('sidx', [0, 4], ALL, ALL, [0, 4], [0, 4], [0, 2], [1, 2], [0, 4], ALL, [0, 4]),
		['referenceId', 'timescale', 'references.0.subsegmentDuration'],
	],
	[
		'stsc',
		boxBytes('stsc', [0, 4], [1, 4], ALL, ALL, ALL),
		['entries.0.firstChunk', 'entries.0.samplesPerChunk', 'entries.0.sampleDescriptionIndex'],
	],
	['stss', boxBytes('stss', [0, 4], [1, 4], ALL), ['sampleNumber.0']],
	['stsz with entry sizes', boxBytes('stsz', [0, 4], [0, 4], [1, 4], ALL), ['entrySize.0']],
	['stsz with one sample size', boxBytes('stsz', [0, 4], ALL, ALL), ['sampleSize', 'sampleCount']],
	[
		'stts',
		boxBytes('stts', [0, 4], [1, 4], ALL, ALL),
		['entries.0.sampleCount', 'entries.0.sampleDelta'],
	],
	[
		// The length sizes are 3, so each number has 4 bytes.
		'tfra',
		boxBytes('tfra', [0, 4], ALL, [0x3f, 4], [1, 4], [0, 4], [0, 4], ALL, ALL, ALL),
		['trackId', 'entries.0.trafNumber', 'entries.0.trunNumber', 'entries.0.sampleNumber'],
	],
	['tkhd', boxBytes('tkhd', [0, 4], [0, 4], [0, 4], ALL, new Uint8Array(68)), ['trackId']],
	[
		// The flags name first_sample_flags, sample_duration, sample_size, and sample_flags.
		'trun',
		boxBytes('trun', [0, 1], [0x704, 3], [1, 4], ALL, ALL, ALL, ALL),
		[
			'firstSampleFlags',
			'samples.0.sampleDuration',
			'samples.0.sampleSize',
			'samples.0.sampleFlags',
		],
	],
]

// Each line: the name of the case, and the bytes of a box with the count and no entry.
const COUNTS: [name: string, bytes: Uint8Array][] = [
	['co64', boxBytes('co64', [0, 4], COUNT)],
	['ctts', boxBytes('ctts', [0, 4], COUNT)],
	['elst', boxBytes('elst', [0, 4], COUNT)],
	['prsl', boxBytes('prsl', [0, 4], [1, 4], COUNT)],
	// The 4 bytes after KID_count are a DataSize of 0, so a read with no key ID does not throw.
	['pssh KID_count', boxBytes('pssh', [1, 1], [0, 3], new Uint8Array(16), COUNT, [0, 4])],
	['pssh DataSize', boxBytes('pssh', [0, 4], new Uint8Array(16), COUNT)],
	['ssix subsegment_count', boxBytes('ssix', [0, 4], COUNT)],
	['ssix ranges_count', boxBytes('ssix', [0, 4], [1, 4], COUNT)],
	['stco', boxBytes('stco', [0, 4], COUNT)],
	['stsc', boxBytes('stsc', [0, 4], COUNT)],
	['stss', boxBytes('stss', [0, 4], COUNT)],
	['stsz', boxBytes('stsz', [0, 4], [0, 4], COUNT)],
	['stts', boxBytes('stts', [0, 4], COUNT)],
	['stz2', boxBytes('stz2', [0, 4], [8, 4], COUNT)],
	['subs', boxBytes('subs', [0, 4], COUNT)],
	['tfra', boxBytes('tfra', [0, 4], [1, 4], [0, 4], COUNT)],
]

describe('unsigned 32-bit fields', function () {
	it('should read a field with all bits set as 4294967295', function () {
		// #region example
		// An mfhd box with the sequence_number ff ff ff ff.
		const bytes = new Uint8Array([
			0, 0, 0, 16, 0x6d, 0x66, 0x68, 0x64, 0, 0, 0, 0, 255, 255, 255, 255,
		])
		const [mfhd] = readIsoBoxes(bytes, { readers: { mfhd: readMfhd } })
		// #endregion example

		assert.deepStrictEqual(mfhd, { type: 'mfhd', version: 0, flags: 0, sequenceNumber: 4294967295 })
	})

	for (const [name, bytes, paths] of VALUES) {
		it(`should read the fields of ${name} with all bits set as unsigned values`, function () {
			const [box] = readIsoBoxes(bytes, createDefaultReaderConfig())

			for (const path of paths) {
				assert.strictEqual(valueAt(box, path), 4294967295, path)
			}
		})
	}

	for (const [name, bytes] of COUNTS) {
		it(`should throw a RangeError at the end of the box for the count 0x80000000 of ${name}`, function () {
			// A negative count or size gives no error, or an error with another message.
			assert.throws(
				() => readIsoBoxes(bytes, createDefaultReaderConfig()),
				/^RangeError: Cannot read \d+ bytes at position/,
			)
		})
	}

	it('should state the sample_count 0x80000000 of trun as 2147483648', function () {
		const bytes = boxBytes('trun', [0, 1], [0x100, 3], COUNT)

		assert.throws(() => readIsoBoxes(bytes, createDefaultReaderConfig()), {
			name: 'RangeError',
			message:
				'readTrun: sample_count must be at most 0 for the 0 bytes of sample records in the box, received 2147483648',
		})
	})

	for (const type of ['dref', 'stsd']) {
		it(`should state the entry_count 0x80000000 of ${type} as 2147483648`, function () {
			const bytes = boxBytes(type, [0, 4], COUNT)

			assert.throws(() => readIsoBoxes(bytes, createDefaultReaderConfig()), {
				name: 'RangeError',
				message: `The ${type} box has an entry_count of 2147483648, and the number of complete child boxes is 0`,
			})
		})
	}
})
