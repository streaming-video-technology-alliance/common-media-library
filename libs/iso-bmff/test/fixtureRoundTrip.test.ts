import { deepStrictEqual } from 'node:assert'
import { isDeepStrictEqual } from 'node:util'
import {
	defaultReaderConfig,
	defaultWriterConfig,
	describe,
	it,
	readIsoBoxes,
	writeIsoBox,
	writeIsoBoxes,
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
	// Issue 623: writeUrl writes a location that flag 0x000001 forbids.
	'SRMP_AC4.mp4/url /bytes': 1,
	'captions.mp4/url /bytes': 1,
	'captions_fragmented.mp4/url /bytes': 1,
	'editlist.mp4/url /bytes': 1,
	'hvc1_init.mp4/url /bytes': 1,
	'spliced_10000.m4v/url /bytes': 1,
	'test_frag.mp4/url /bytes': 2,
	'time_to_sample.mp4/url /bytes': 2,

	// Issue 623: the url box grows by one byte and moves the media data.
	'captions.mp4/stco/offsets': 30,
	'editlist.mp4/stco/offsets': 1,
	'test_frag.mp4/tfra/offsets': 3,

	// Issue 624: writePrsl omits an empty tag that the flags declare.
	'SRMP_AC4.mp4/prsl/bytes': 6,
	'SRMP_AC4.mp4/prsl/values': 6,

	// Issue 630: readUtf8(-1) moves past a string by the character count.
	'SRMP_AC4.mp4/labl/remaining': 1,

	// Issue 635: a string with no null byte moves the view past the end of the box.
	'240fps_go_pro_hero_4.mp4/hdlr/remaining': 3,
	'SRMP_AC4.mp4/url /remaining': 1,
	'captions.mp4/url /remaining': 1,
	'captions_fragmented.mp4/url /remaining': 1,
	'editlist.mp4/url /remaining': 1,
	'hvc1_init.mp4/url /remaining': 1,
	'spliced_10000.m4v/url /remaining': 1,
	'test_frag.mp4/url /remaining': 2,
	'time_to_sample.mp4/url /remaining': 2,
	'vttc.mp4/iden/remaining': 2,
	'vttc.mp4/payl/remaining': 1,
	'vttc.mp4/sttg/remaining': 1,
	'webvtt.m4s/payl/remaining': 3,

	// Issue 636: the writer adds a null byte after the string.
	'vttc.mp4/iden/bytes': 2,
	'vttc.mp4/payl/bytes': 1,
	'vttc.mp4/sttg/bytes': 1,
	'webvtt.m4s/payl/bytes': 3,

	// PR 620: readTemplate and writeTemplate use a wrong divisor for the fraction.
	'240fps_go_pro_hero_4.mp4/tkhd/bytes': 1,
	'time_to_sample.mp4/tkhd/bytes': 1,
	'time_to_sample.mp4/tkhd/values': 1,

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

const readerConfig = defaultReaderConfig()
const { readers = {} } = readerConfig
const { writers } = defaultWriterConfig()

// Writers that return the source bytes of a box.
const sourceWriters = Object.fromEntries(
	Object.keys(writers).map(type => [type, ({ view }: ParsedIsoBox) => view]),
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
function* walk(boxes: ParsedIsoBox[]): Generator<ParsedIsoBox> {
	for (const box of boxes) {
		yield box

		if ('boxes' in box) {
			yield* walk(box.boxes as ParsedIsoBox[])
		} else if (box.type === 'dref' || box.type === 'stsd') {
			yield* walk(box.entries as ParsedIsoBox[])
		}
	}
}

// The samples of a WebVTT track are boxes inside the mdat box.
function* walkSamples(boxes: ParsedIsoBox[]): Generator<ParsedIsoBox> {
	for (const box of boxes) {
		if (
			box.type === 'mdat' &&
			['vttc', 'vtte'].includes(String.fromCharCode(...box.data.subarray(4, 8)))
		) {
			yield* walk(readIsoBoxes(box.data, readerConfig))
		}
	}
}

describe('fixture round trip', function () {
	it('should read, write, and read every fixture with the default configs', function () {
		const failed: Record<string, number> = {}
		const read = counts(readers)
		const written = counts(writers)

		for (const file of fixtureFiles()) {
			const source = new Uint8Array(load(file))
			const boxes = readIsoBoxes(source, readerConfig)
			const tree = [...walk(boxes)]
			const fail = (type: string, check: string): void => {
				const key = `${file}/${type}/${check}`
				failed[key] = (failed[key] ?? 0) + 1
			}
			let changed = false

			for (const box of [...tree, ...walkSamples(tree)]) {
				const { type, view } = box
				const writer = writers[type]

				if (type in readers) {
					read[type]++

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

				if (!isDeepStrictEqual(values(readIsoBoxes(output, readerConfig)), values([box]))) {
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
							? box.entries.map(entry => entry.moofOffset)
							: []

				for (const offset of offsets) {
					if (!same(output.subarray(offset, offset + 16), source.subarray(offset, offset + 16))) {
						fail(box.type, 'offsets')
					}
				}
			}
		}

		deepStrictEqual({ failed, read, written }, { failed: EXCEPTIONS, read: BOXES, written: BOXES })
	})
})
