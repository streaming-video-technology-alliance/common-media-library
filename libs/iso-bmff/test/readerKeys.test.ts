import { createDefaultReaderConfig, isIsoBoxType, readIsoBoxes, readTfhd } from '@svta/cml-iso-bmff'
import assert from 'node:assert'
import { describe, it } from 'vite-plus/test'
import { boxBytes } from './util/wideBoxes.ts'

const FULL = ['type', 'version', 'flags']

const AUDIO = [
	'type',
	'dataReferenceIndex',
	'entryVersion',
	'channelCount',
	'sampleSize',
	'preDefined',
	'sampleRate',
	'boxes',
]

const VISUAL = [
	'type',
	'dataReferenceIndex',
	'preDefined1',
	'preDefined2',
	'width',
	'height',
	'horizResolution',
	'vertResolution',
	'frameCount',
	'compressorName',
	'depth',
	'preDefined3',
	'boxes',
]

const EMSG = [
	...FULL,
	'schemeIdUri',
	'value',
	'timescale',
	'presentationTimeDelta',
	'presentationTime',
	'eventDuration',
	'id',
	'messageData',
]

const STSZ = [...FULL, 'sampleSize', 'sampleCount', 'entrySize']

const TENC = [
	...FULL,
	'defaultPerSampleIvSize',
	'defaultKid',
	'defaultIsProtected',
	'defaultCryptByteBlock',
	'defaultSkipByteBlock',
	'defaultConstantIv',
]

const TRUN = [...FULL, 'dataOffset', 'firstSampleFlags', 'samples']

// Each line: the box type, the body of the box, and the keys of the box type.
// With a body of zero bytes, the flags and the version exclude every optional field.
const ROWS: [type: string, body: Uint8Array, keys: string[]][] = [
	['ardi', new Uint8Array(5), [...FULL, 'audioRenderingIndication']],
	['avc1', new Uint8Array(78), VISUAL],
	['avc2', new Uint8Array(78), VISUAL],
	['avc3', new Uint8Array(78), VISUAL],
	['avc4', new Uint8Array(78), VISUAL],
	['co64', new Uint8Array(8), [...FULL, 'chunkOffset']],
	['ctts', new Uint8Array(8), [...FULL, 'entryCount', 'entries']],
	// A version 2 box has the count and no entries.
	['ctts', new Uint8Array([2, 0, 0, 0, 0, 0, 0, 1]), [...FULL, 'entryCount', 'entries']],
	['dref', new Uint8Array(8), [...FULL, 'boxes']],
	['elng', new Uint8Array(4), [...FULL, 'extendedLanguage']],
	['elst', new Uint8Array(8), [...FULL, 'entries']],
	['emsg', new Uint8Array(22), EMSG],
	// A version 1 box has presentation_time and no presentation_time_delta.
	['emsg', new Uint8Array([1, ...new Array<number>(25).fill(0)]), EMSG],
	// A box of another version has neither time field.
	['emsg', new Uint8Array([2, 0, 0, 0]), EMSG],
	['enca', new Uint8Array(28), AUDIO],
	['encv', new Uint8Array(78), VISUAL],
	['free', new Uint8Array(0), ['type', 'data']],
	['frma', new Uint8Array(4), ['type', 'dataFormat']],
	['ftyp', new Uint8Array(8), ['type', 'majorBrand', 'minorVersion', 'compatibleBrands']],
	['hdlr', new Uint8Array(24), [...FULL, 'preDefined', 'handlerType', 'reserved', 'name']],
	['hev1', new Uint8Array(78), VISUAL],
	['hvc1', new Uint8Array(78), VISUAL],
	['iden', new Uint8Array(0), ['type', 'cueId']],
	['imda', new Uint8Array(4), ['type', 'imdaIdentifier', 'data']],
	['kind', new Uint8Array(4), [...FULL, 'schemeUri', 'value']],
	['labl', new Uint8Array(6), [...FULL, 'labelId', 'language', 'label']],
	['mdat', new Uint8Array(0), ['type', 'data']],
	[
		'mdhd',
		new Uint8Array(24),
		[
			...FULL,
			'creationTime',
			'modificationTime',
			'timescale',
			'duration',
			'language',
			'preDefined',
		],
	],
	['mehd', new Uint8Array(8), [...FULL, 'fragmentDuration']],
	['meta', new Uint8Array(4), [...FULL, 'boxes']],
	['mfhd', new Uint8Array(8), [...FULL, 'sequenceNumber']],
	['mfro', new Uint8Array(8), [...FULL, 'mfraSize']],
	['mp4a', new Uint8Array(28), AUDIO],
	[
		'mvhd',
		new Uint8Array(100),
		[
			...FULL,
			'creationTime',
			'modificationTime',
			'timescale',
			'duration',
			'rate',
			'volume',
			'matrix',
			'preDefined',
			'nextTrackId',
		],
	],
	['payl', new Uint8Array(0), ['type', 'cueText']],
	[
		'prft',
		new Uint8Array(20),
		[...FULL, 'referenceTrackId', 'ntpTimestampSec', 'ntpTimestampFrac', 'mediaTime'],
	],
	[
		'prsl',
		new Uint8Array(12),
		[
			...FULL,
			'groupId',
			'entityId',
			'preselectionTag',
			'selectionPriority',
			'interleavingTag',
			'boxes',
		],
	],
	['pssh', new Uint8Array(24), [...FULL, 'systemId', 'kid', 'data']],
	['schm', new Uint8Array(12), [...FULL, 'schemeType', 'schemeVersion', 'schemeUri']],
	['sdtp', new Uint8Array(4), [...FULL, 'sampleDependencyTable']],
	[
		'sidx',
		new Uint8Array(24),
		[...FULL, 'referenceId', 'timescale', 'earliestPresentationTime', 'firstOffset', 'references'],
	],
	['skip', new Uint8Array(0), ['type', 'data']],
	['smhd', new Uint8Array(8), [...FULL, 'balance']],
	['ssix', new Uint8Array(8), [...FULL, 'subsegments']],
	['stco', new Uint8Array(8), [...FULL, 'chunkOffset']],
	['sthd', new Uint8Array(4), FULL],
	['stsc', new Uint8Array(8), [...FULL, 'entries']],
	['stsd', new Uint8Array(8), [...FULL, 'boxes']],
	['stss', new Uint8Array(8), [...FULL, 'sampleNumber']],
	['stsz', new Uint8Array(12), STSZ],
	// A sample_size other than 0 has the count and no entry sizes.
	['stsz', new Uint8Array([0, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 1]), STSZ],
	['sttg', new Uint8Array(0), ['type', 'settings']],
	['stts', new Uint8Array(8), [...FULL, 'entries']],
	['styp', new Uint8Array(8), ['type', 'majorBrand', 'minorVersion', 'compatibleBrands']],
	['stz2', new Uint8Array(12), [...FULL, 'fieldSize', 'entrySize']],
	['subs', new Uint8Array(8), [...FULL, 'entries']],
	['tenc', new Uint8Array(24), TENC],
	// A version 1 box has the pattern. A box with an IV for each sample has no constant IV.
	['tenc', new Uint8Array([1, 0, 0, 0, 0, 0x19, 1, 8, ...new Array<number>(16).fill(0)]), TENC],
	['tfdt', new Uint8Array(8), [...FULL, 'baseMediaDecodeTime']],
	[
		'tfhd',
		new Uint8Array(8),
		[
			...FULL,
			'trackId',
			'baseDataOffset',
			'sampleDescriptionIndex',
			'defaultSampleDuration',
			'defaultSampleSize',
			'defaultSampleFlags',
		],
	],
	[
		'tfra',
		new Uint8Array(16),
		[
			...FULL,
			'trackId',
			'lengthSizeOfTrafNum',
			'lengthSizeOfTrunNum',
			'lengthSizeOfSampleNum',
			'entries',
		],
	],
	[
		'tkhd',
		new Uint8Array(84),
		[
			...FULL,
			'creationTime',
			'modificationTime',
			'trackId',
			'duration',
			'layer',
			'alternateGroup',
			'volume',
			'matrix',
			'width',
			'height',
		],
	],
	[
		'trex',
		new Uint8Array(24),
		[
			...FULL,
			'trackId',
			'defaultSampleDescriptionIndex',
			'defaultSampleDuration',
			'defaultSampleSize',
			'defaultSampleFlags',
		],
	],
	['trun', new Uint8Array(8), TRUN],
	['url ', new Uint8Array(4), [...FULL, 'location']],
	['urn ', new Uint8Array(4), [...FULL, 'name', 'location']],
	['vlab', new Uint8Array(0), ['type', 'sourceLabel']],
	['vmhd', new Uint8Array(12), [...FULL, 'graphicsMode', 'opColor']],
	['vttC', new Uint8Array(0), ['type', 'config']],
	['vtte', new Uint8Array(0), ['type']],
]

describe('keys of the built-in readers', function () {
	it('should return a key with the value undefined for a field that the flags exclude', function () {
		// #region example
		// A tfhd box with the flags 0 has only track_ID. Each other field is undefined.
		const bytes = new Uint8Array([0, 0, 0, 16, 0x74, 0x66, 0x68, 0x64, 0, 0, 0, 0, 0, 0, 0, 1])
		const [tfhd] = readIsoBoxes(bytes, { readers: { tfhd: readTfhd } })
		// #endregion example

		assert.ok(isIsoBoxType('tfhd', tfhd))
		assert.strictEqual('defaultSampleDuration' in tfhd, true)
		assert.strictEqual(tfhd.defaultSampleDuration, undefined)
	})

	it('should have a line for every reader of the default configuration', function () {
		const { readers = {} } = createDefaultReaderConfig()

		assert.deepStrictEqual(
			[...new Set(ROWS.map(([type]) => type))].sort(),
			Object.keys(readers).sort(),
		)
	})

	for (const [type, body, keys] of ROWS) {
		const name = body.some(Boolean) ? `the bytes ${body.join(' ')}` : `${body.length} zero bytes`

		it(`should return every key of a ${type} box with a body of ${name}`, function () {
			const [box] = readIsoBoxes(boxBytes(type, body), createDefaultReaderConfig())

			assert.ok(box)
			assert.deepStrictEqual(Object.keys(box).sort(), [...keys].sort())
		})
	}

	it('should return the four keys of a trun sample with no fields', function () {
		// The flags are 0 and sample_count is 1, so the sample has 0 bytes.
		const [box] = readIsoBoxes(boxBytes('trun', [0, 4], [1, 4]), createDefaultReaderConfig())

		assert.ok(isIsoBoxType('trun', box))
		assert.deepStrictEqual(Object.keys(box.samples[0]).sort(), [
			'sampleCompositionTimeOffset',
			'sampleDuration',
			'sampleFlags',
			'sampleSize',
		])
	})
})
