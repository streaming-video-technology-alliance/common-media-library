import {
	assert,
	describe,
	it,
	readFrma,
	readImda,
	readIsoBoxes,
	readSdtp,
	readSkip,
	readVttC,
	writeFrma,
	writeImda,
	writeIsoBox,
	writeSdtp,
	writeSkip,
	writeVttC,
	type IsoBoxReaderMap,
	type IsoBoxWriterMap,
} from './util/box.ts'
import { boxBytes } from './util/wideBoxes.ts'

type Row = {
	type: string
	readers: IsoBoxReaderMap
	writers: IsoBoxWriterMap
	bytes: Uint8Array<ArrayBuffer>
	expected: Record<string, unknown>
}

const ROWS: Row[] = [
	{
		type: 'frma',
		readers: { frma: readFrma },
		writers: { frma: writeFrma },
		bytes: boxBytes('frma', [0x61766331, 4]),
		expected: { type: 'frma', dataFormat: 'avc1' },
	},
	{
		type: 'imda',
		readers: { imda: readImda },
		writers: { imda: writeImda },
		bytes: boxBytes('imda', [7, 4], new Uint8Array([1, 2, 3])),
		expected: { type: 'imda', imdaIdentifier: 7, data: new Uint8Array([1, 2, 3]) },
	},
	{
		type: 'sdtp',
		readers: { sdtp: readSdtp },
		writers: { sdtp: writeSdtp },
		bytes: boxBytes('sdtp', [0, 1], [0, 3], [0x10, 1], [0x28, 1], [0x04, 1]),
		expected: {
			type: 'sdtp',
			version: 0,
			flags: 0,
			sampleDependencyTable: new Uint8Array([0x10, 0x28, 0x04]),
		},
	},
	{
		type: 'skip',
		readers: { skip: readSkip },
		writers: { skip: writeSkip },
		bytes: boxBytes('skip', new Uint8Array([1, 2, 3])),
		expected: { type: 'skip', data: new Uint8Array([1, 2, 3]) },
	},
	{
		type: 'vttC',
		readers: { vttC: readVttC },
		writers: { vttC: writeVttC },
		bytes: boxBytes('vttC', new Uint8Array([0x57, 0x45, 0x42, 0x56, 0x54, 0x54])),
		expected: { type: 'vttC', config: 'WEBVTT' },
	},
]

function fields(box: object, expected: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(
		Object.keys(expected).map(key => [key, (box as Record<string, unknown>)[key]]),
	)
}

describe('boxes with no other tests', function () {
	for (const { type, readers, writers, bytes, expected } of ROWS) {
		it(`should read the fields of ${type} and write the same bytes`, function () {
			const [box] = readIsoBoxes(bytes, { readers })

			assert.ok(box)
			assert.deepStrictEqual(fields(box, expected), expected)
			assert.deepStrictEqual(writeIsoBox(expected as never, { writers }), bytes)
		})
	}
})
