import { deepStrictEqual } from 'node:assert'
import { isDeepStrictEqual } from 'node:util'
import {
	defaultReaderConfig,
	defaultWriterConfig,
	describe,
	it,
	readInt64AsBigInt,
	readIsoBoxes,
	writeIsoBox,
	writeIsoBoxes,
	type IsoBoxData,
	type IsoInt64,
	type ParsedIsoBox,
} from './util/box.ts'
import { fixtureFiles } from './util/fixtureFiles.ts'
import { load } from './util/load.ts'
import { reduceUint8Arrays } from './util/reduceUint8Arrays.ts'

// Known defects. A line is `fixture/box type/check` and the count of boxes that fail the check.
// The box type `file` is the whole fixture. The checks:
// - bytes: the written box differs from the source bytes.
// - values: a read of the written box returns other fields.
// - remaining: the reader does not stop at the end of the box.
// - offsets: after the write, a chunk offset or a moof offset addresses other bytes.
// The test fails when a line and the result differ, so a fix removes its lines.
const EXCEPTIONS: Record<string, number> = {
	// No issue: writeHdlr adds a null byte to a name that has none.
	'240fps_go_pro_hero_4.mp4/hdlr/bytes': 3,

	// The fixture ends inside a box. readIsoBoxes omits that box.
	'spliced_10000.m4v/file/remaining': 1,
}

// The count of boxes in the fixtures for each type in the default configs.
// The default reader reads that many boxes and the default writer writes that many.
// A type with the count 0 has no box in a fixture, so this test does not cover it.
const BOXES: Record<string, number> = {
	ardi: 6,
	avc1: 4,
	avc2: 0,
	avc3: 0,
	avc4: 0,
	ctts: 1,
	dref: 13,
	elng: 6,
	elst: 4,
	emsg: 1,
	enca: 0,
	encv: 0,
	free: 6,
	frma: 0,
	ftyp: 9,
	hdlr: 15,
	hev1: 0,
	hvc1: 1,
	iden: 2,
	imda: 0,
	kind: 6,
	labl: 10,
	mdat: 230,
	mdhd: 13,
	mehd: 4,
	meta: 2,
	mfhd: 226,
	mfro: 1,
	mp4a: 4,
	mvhd: 9,
	payl: 4,
	prft: 60,
	prsl: 6,
	pssh: 0,
	schm: 0,
	sdtp: 0,
	sidx: 7,
	skip: 0,
	smhd: 5,
	ssix: 1,
	stco: 13,
	sthd: 2,
	stsc: 13,
	stsd: 13,
	stss: 2,
	stsz: 13,
	sttg: 1,
	stts: 13,
	styp: 5,
	subs: 1,
	tenc: 0,
	tfdt: 226,
	tfhd: 226,
	tfra: 2,
	tkhd: 13,
	trex: 6,
	trun: 226,
	'url ': 10,
	'urn ': 0,
	vlab: 0,
	vmhd: 5,
	vttC: 0,
	vtte: 1,
}

const { readers = {} } = defaultReaderConfig()
const { writers } = defaultWriterConfig()

type Read = (data: IsoBoxData) => ParsedIsoBox<IsoInt64>[]

// The test runs one time for each line: the name of the test, the type of the 64-bit fields, and the read function.
// The counts and the known defects are the same for both.
const MODES: [string, string, Read][] = [
	['the default configs', 'number', data => readIsoBoxes(data, defaultReaderConfig())],
	[
		'readInt64AsBigInt',
		'bigint',
		data => readIsoBoxes(data, defaultReaderConfig({ int64: readInt64AsBigInt })),
	],
]

// Writers that return the source bytes of a box.
const sourceWriters = Object.fromEntries(
	Object.keys(writers).map(type => [type, ({ view }: ParsedIsoBox<IsoInt64>) => view]),
)

function counts(config: object): Record<string, number> {
	return Object.fromEntries(Object.keys(config).map(type => [type, 0]))
}

function bytes(view: ArrayBufferView): Uint8Array {
	return new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
}

function same(a: Uint8Array, b: Uint8Array): boolean {
	return Buffer.compare(a, b) === 0
}

// The fields of a box without `view` and `size`. The bytes check covers both.
function values(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(values)
	}

	if (value === null || typeof value !== 'object' || ArrayBuffer.isView(value)) {
		return value
	}

	return Object.fromEntries(
		Object.entries(value)
			.filter(([key]) => key !== 'view' && key !== 'size')
			.map(([key, field]): [string, unknown] => [key, values(field)]),
	)
}

// `traverseIsoBoxes` does not yield the entries of the dref and stsd boxes.
function* walk(boxes: ParsedIsoBox<IsoInt64>[]): Generator<ParsedIsoBox<IsoInt64>> {
	for (const box of boxes) {
		yield box

		if ('boxes' in box) {
			yield* walk(box.boxes as ParsedIsoBox<IsoInt64>[])
		} else if (box.type === 'dref' || box.type === 'stsd') {
			yield* walk(box.entries as ParsedIsoBox<IsoInt64>[])
		}
	}
}

// The samples of a WebVTT track are boxes inside the mdat box.
function* walkSamples(
	boxes: ParsedIsoBox<IsoInt64>[],
	read: Read,
): Generator<ParsedIsoBox<IsoInt64>> {
	for (const box of boxes) {
		if (
			box.type === 'mdat' &&
			['vttc', 'vtte'].includes(String.fromCharCode(...box.data.subarray(4, 8)))
		) {
			yield* walk(read(box.data))
		}
	}
}

describe('fixture round trip', function () {
	for (const [name, kind, read] of MODES) {
		it(`should read, write, and read every fixture with ${name}`, function () {
			const failed: Record<string, number> = {}
			const parsed = counts(readers)
			const written = counts(writers)
			const fields = new Set<string>()

			for (const file of fixtureFiles()) {
				const source = new Uint8Array(load(file))
				const boxes = read(source)
				const tree = [...walk(boxes)]
				const fail = (type: string, check: string): void => {
					const key = `${file}/${type}/${check}`
					failed[key] = (failed[key] ?? 0) + 1
				}
				let changed = false

				for (const box of [...tree, ...walkSamples(tree, read)]) {
					const { type, view } = box
					const writer = writers[type]

					if (box.type === 'tfdt') {
						fields.add(typeof box.baseMediaDecodeTime)
					}

					if (type in readers) {
						parsed[type]++

						if (view.bytesRemaining !== 0) {
							fail(type, 'remaining')
						}
					}

					if (!writer) {
						continue
					}

					// Only the writer of this box runs. The child boxes keep their source bytes.
					const output = writeIsoBox(box, { writers: { ...sourceWriters, [type]: writer } })

					written[type]++

					if (!same(output, bytes(view))) {
						fail(type, 'bytes')
						changed ||= tree.includes(box)
					}

					if (!isDeepStrictEqual(values(read(output)), values([box]))) {
						fail(type, 'values')
					}
				}

				const output = reduceUint8Arrays(writeIsoBoxes(boxes, { writers }))
				const end = boxes.reduce((size, box) => size + box.view.byteLength, 0)

				if (end !== source.length) {
					fail('file', 'remaining')
				}

				// A box that fails the bytes check changes the file. The line of that box covers the file.
				if (!changed && !same(output, source.subarray(0, end))) {
					fail('file', 'bytes')
				}

				for (const box of tree) {
					const offsets =
						box.type === 'stco'
							? box.chunkOffset
							: box.type === 'tfra'
								? box.entries.map(entry => Number(entry.moofOffset))
								: []

					for (const offset of offsets) {
						if (!same(output.subarray(offset, offset + 16), source.subarray(offset, offset + 16))) {
							fail(box.type, 'offsets')
						}
					}
				}
			}

			deepStrictEqual(
				{ failed, read: parsed, written, fields: [...fields] },
				{ failed: EXCEPTIONS, read: BOXES, written: BOXES, fields: [kind] },
			)
		})
	}
})
