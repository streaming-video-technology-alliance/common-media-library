import * as isoBmff from '@svta/cml-iso-bmff'
import { deepStrictEqual } from 'node:assert'
import {
	assert,
	CONTAINERS,
	defaultReaderConfig,
	defaultWriterConfig,
	describe,
	IsoBoxWriteView,
	it,
	readIsoBoxes,
	writeDinf,
	writeEdts,
	writeGrpl,
	writeIsoBox,
	writeIsoBoxes,
	writeMdia,
	writeMeco,
	writeMfhd,
	writeMfra,
	writeMinf,
	writeMoof,
	writeMoov,
	writeMvex,
	writeSchi,
	writeSinf,
	writeStbl,
	writeStrk,
	writeTfdt,
	writeTraf,
	writeTrak,
	writeTref,
	writeUdta,
	writeVttc,
	type IsoBoxContainerMap,
	type IsoBoxWriteViewConfig,
	type IsoInt64,
	type MovieFragmentBox,
	type MovieFragmentHeaderBox,
	type TrackFragmentBaseMediaDecodeTimeBox,
	type TrackFragmentBox,
} from './util/box.ts'
import { fixtureFiles } from './util/fixtureFiles.ts'
import { load } from './util/load.ts'
import { reduceUint8Arrays } from './util/reduceUint8Arrays.ts'
import { boxBytes } from './util/wideBoxes.ts'

type ContainerType = keyof IsoBoxContainerMap

// A container box with number fields or bigint fields in the child boxes.
type ContainerBoxes = IsoBoxContainerMap<IsoInt64>

type ContainerWriters = {
	[K in ContainerType]: (box: ContainerBoxes[K], config: IsoBoxWriteViewConfig) => IsoBoxWriteView
}

const WRITERS: ContainerWriters = {
	dinf: writeDinf,
	edts: writeEdts,
	grpl: writeGrpl,
	mdia: writeMdia,
	meco: writeMeco,
	mfra: writeMfra,
	minf: writeMinf,
	moof: writeMoof,
	moov: writeMoov,
	mvex: writeMvex,
	schi: writeSchi,
	sinf: writeSinf,
	stbl: writeStbl,
	strk: writeStrk,
	traf: writeTraf,
	trak: writeTrak,
	tref: writeTref,
	udta: writeUdta,
	vttc: writeVttc,
}

const TYPES = Object.keys(WRITERS) as ContainerType[]

// An mfhd box with the sequence number 1.
const MFHD: MovieFragmentHeaderBox = { type: 'mfhd', version: 0, flags: 0, sequenceNumber: 1 }
const MFHD_BYTES = boxBytes('mfhd', Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 1))
const CONFIG: IsoBoxWriteViewConfig = { writers: { mfhd: writeMfhd } }

function containerBox<K extends ContainerType>(type: K, boxes: unknown[]): ContainerBoxes[K] {
	return { type, boxes } as ContainerBoxes[K]
}

// A direct call of the writer for the box type.
function write<K extends ContainerType>(
	type: K,
	boxes: unknown[],
	config: IsoBoxWriteViewConfig,
): IsoBoxWriteView {
	return WRITERS[type](containerBox(type, boxes), config)
}

function bytes(view: ArrayBufferView): Uint8Array {
	return new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
}

describe('container writers', function () {
	it('should have a writer for every box type in CONTAINERS', function () {
		deepStrictEqual(TYPES, CONTAINERS)
	})

	it('should have no entry in the default configuration', function () {
		const { writers } = defaultWriterConfig()

		deepStrictEqual(
			CONTAINERS.filter(type => type in writers),
			[],
		)
	})

	for (const type of TYPES) {
		const writer = WRITERS[type]
		const name = `write${type[0].toUpperCase()}${type.slice(1)}`

		describe(name, function () {
			it('should be the export with the name of the box type', function () {
				assert.strictEqual(typeof writer, 'function')
				assert.strictEqual((isoBmff as Record<string, unknown>)[name], writer)
			})

			it('should write the box header and the child boxes', function () {
				const view = write(type, [MFHD], CONFIG)

				assert.ok(view instanceof IsoBoxWriteView)
				deepStrictEqual(bytes(view), boxBytes(type, MFHD_BYTES))
			})

			it('should write an empty box', function () {
				deepStrictEqual(bytes(write(type, [], { writers: {} })), boxBytes(type))
			})

			it('should write the same bytes as writeIsoBox', function () {
				const box = containerBox(type, [MFHD])

				deepStrictEqual(bytes(write(type, [MFHD], CONFIG)), writeIsoBox(box, CONFIG))
			})

			it('should write the same bytes as a configuration with no entry for the box type', function () {
				const box = containerBox(type, [MFHD])
				const expected = writeIsoBoxes([box], CONFIG)
				const output = writeIsoBoxes([box], { writers: { mfhd: writeMfhd, [type]: writer } })

				deepStrictEqual(expected, [boxBytes(type, MFHD_BYTES)])
				deepStrictEqual(output, expected)
			})
		})
	}

	it('should write the same bytes for every fixture with and without the container writers', function () {
		const config = defaultWriterConfig()
		const containerConfig = { writers: { ...config.writers, ...WRITERS } }

		for (const file of fixtureFiles()) {
			const boxes = readIsoBoxes(load(file), defaultReaderConfig())

			deepStrictEqual(
				reduceUint8Arrays(writeIsoBoxes(boxes, containerConfig)),
				reduceUint8Arrays(writeIsoBoxes(boxes, config)),
				file,
			)
		}
	})

	it('should write child boxes with bigint fields', function () {
		// 2^53 + 1. A number cannot hold this value.
		const exact = BigInt('9007199254740993')
		const tfdt: TrackFragmentBaseMediaDecodeTimeBox<bigint> = {
			type: 'tfdt',
			version: 1,
			flags: 0,
			baseMediaDecodeTime: exact,
		}
		const traf: TrackFragmentBox<bigint> = { type: 'traf', boxes: [tfdt] }
		const moof: MovieFragmentBox<bigint> = { type: 'moof', boxes: [traf] }
		const view = writeMoof(moof, { writers: { traf: writeTraf, tfdt: writeTfdt } })

		deepStrictEqual(
			bytes(view),
			boxBytes('moof', boxBytes('traf', boxBytes('tfdt', [1, 1], [0, 3], [exact, 8]))),
		)
	})

	it('should reject a box of another type at compile time', function () {
		const moof: MovieFragmentBox = { type: 'moof', boxes: [] }

		// @ts-expect-error A moof box is not a MovieBox.
		const view = writeMoov(moof, { writers: {} })

		assert.strictEqual(view.byteLength, 8)
	})
})
