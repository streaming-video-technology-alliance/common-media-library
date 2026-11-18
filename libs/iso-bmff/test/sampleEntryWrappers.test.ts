import {
	assert,
	describe,
	it,
	readAvc2,
	readAvc3,
	readAvc4,
	readEnca,
	readEncv,
	readHev1,
	readIsoBoxes,
	writeAvc2,
	writeAvc3,
	writeAvc4,
	writeEnca,
	writeEncv,
	writeHev1,
	writeIsoBox,
	type IsoBoxReaderMap,
	type IsoBoxWriterMap,
} from './util/box.ts'
import { boxBytes, type BoxField } from './util/wideBoxes.ts'

const NAME = [4, 0x74, 0x65, 0x73, 0x74, ...new Array<number>(27).fill(0)] // length + 'test'

const VISUAL_FIELDS: BoxField[] = [
	new Uint8Array(6),
	[1, 2],
	[0, 2],
	[0, 2],
	new Uint8Array(12),
	[640, 2],
	[360, 2],
	[0x00480000, 4],
	[0x00480000, 4],
	[0, 4],
	[1, 2],
	new Uint8Array(NAME),
	[0x18, 2],
	[0xffff, 2],
]

const VISUAL = {
	reserved1: [0, 0, 0, 0, 0, 0],
	dataReferenceIndex: 1,
	preDefined1: 0,
	reserved2: 0,
	preDefined2: [0, 0, 0],
	width: 640,
	height: 360,
	horizResolution: 72,
	vertResolution: 72,
	reserved3: 0,
	frameCount: 1,
	compressorName: NAME,
	depth: 0x18,
	preDefined3: -1,
	boxes: [],
}

const AUDIO_FIELDS: BoxField[] = [
	new Uint8Array(6),
	[1, 2],
	new Uint8Array(8),
	[2, 2],
	[16, 2],
	[0, 2],
	[0, 2],
	[48000 * 0x10000, 4],
]

const AUDIO = {
	reserved1: [0, 0, 0, 0, 0, 0],
	dataReferenceIndex: 1,
	reserved2: [0, 0],
	channelCount: 2,
	sampleSize: 16,
	preDefined: 0,
	reserved3: 0,
	sampleRate: 48000,
	boxes: [],
}

type Row = {
	type: string
	readers: IsoBoxReaderMap
	writers: IsoBoxWriterMap
	fields: BoxField[]
	expected: Record<string, unknown>
}

const ROWS: Row[] = [
	{
		type: 'avc2',
		readers: { avc2: readAvc2 },
		writers: { avc2: writeAvc2 },
		fields: VISUAL_FIELDS,
		expected: VISUAL,
	},
	{
		type: 'avc3',
		readers: { avc3: readAvc3 },
		writers: { avc3: writeAvc3 },
		fields: VISUAL_FIELDS,
		expected: VISUAL,
	},
	{
		type: 'avc4',
		readers: { avc4: readAvc4 },
		writers: { avc4: writeAvc4 },
		fields: VISUAL_FIELDS,
		expected: VISUAL,
	},
	{
		type: 'hev1',
		readers: { hev1: readHev1 },
		writers: { hev1: writeHev1 },
		fields: VISUAL_FIELDS,
		expected: VISUAL,
	},
	{
		type: 'encv',
		readers: { encv: readEncv },
		writers: { encv: writeEncv },
		fields: VISUAL_FIELDS,
		expected: VISUAL,
	},
	{
		type: 'enca',
		readers: { enca: readEnca },
		writers: { enca: writeEnca },
		fields: AUDIO_FIELDS,
		expected: AUDIO,
	},
]

describe('sample entry wrappers', function () {
	for (const { type, readers, writers, fields, expected } of ROWS) {
		it(`should read the fields of ${type} and write the same bytes`, function () {
			const bytes = boxBytes(type, ...fields)
			const [box] = readIsoBoxes(bytes, { readers })
			const values = { type, ...expected }

			assert.ok(box)
			assert.deepStrictEqual(
				Object.fromEntries(
					Object.keys(values).map(key => [key, (box as Record<string, unknown>)[key]]),
				),
				values,
			)
			assert.deepStrictEqual(writeIsoBox(values as never, { writers }), bytes)
		})
	}
})
