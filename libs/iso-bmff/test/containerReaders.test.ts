import * as isoBmff from '@svta/cml-iso-bmff'
import { deepStrictEqual } from 'node:assert'
import {
	assert,
	CONTAINERS,
	defaultReaderConfig,
	describe,
	IsoBoxReadView,
	it,
	readDinf,
	readEdts,
	readGrpl,
	readInt64AsBigInt,
	readIsoBoxes,
	readMdia,
	readMeco,
	readMfhd,
	readMfra,
	readMinf,
	readMoof,
	readMoov,
	readMvex,
	readMvhd,
	readSchi,
	readSinf,
	readStbl,
	readStrk,
	readTfdt,
	readTraf,
	readTrak,
	readTref,
	readUdta,
	readVttc,
	type IsoBoxContainerMap,
	type IsoBoxReader,
	type IsoBoxType,
	type IsoInt64,
	type MovieBoxChild,
} from './util/box.ts'
import { expectType, type Equal } from './util/expectType.ts'
import { fixtureFiles } from './util/fixtureFiles.ts'
import { load } from './util/load.ts'
import { values } from './util/values.ts'
import { boxBytes } from './util/wideBoxes.ts'

type ContainerReaders<V extends IsoInt64> = {
	[K in keyof IsoBoxContainerMap<V>]: IsoBoxReader<IsoBoxContainerMap<V>[K], IsoBoxType, V>
}

// Each reader accepts a view with number fields and a view with bigint fields.
const CONTAINER_READERS = {
	dinf: readDinf,
	edts: readEdts,
	grpl: readGrpl,
	mdia: readMdia,
	meco: readMeco,
	mfra: readMfra,
	minf: readMinf,
	moof: readMoof,
	moov: readMoov,
	mvex: readMvex,
	schi: readSchi,
	sinf: readSinf,
	stbl: readStbl,
	strk: readStrk,
	traf: readTraf,
	trak: readTrak,
	tref: readTref,
	udta: readUdta,
	vttc: readVttc,
} satisfies ContainerReaders<number> & ContainerReaders<bigint>

const READERS: ContainerReaders<number> = CONTAINER_READERS

const TYPES = Object.keys(READERS) as (keyof IsoBoxContainerMap)[]

// An mfhd box with the sequence number 1.
const MFHD = boxBytes('mfhd', Uint8Array.of(0, 0, 0, 0, 0, 0, 0, 1))
const MFHD_VALUES = { type: 'mfhd', version: 0, flags: 0, sequenceNumber: 1 }

// 2^53 + 1. A number cannot hold this value.
const EXACT = BigInt('9007199254740993')

describe('container readers', function () {
	it('should have a reader for every box type in CONTAINERS', function () {
		deepStrictEqual(TYPES, CONTAINERS)
	})

	for (const type of TYPES) {
		const reader = READERS[type]
		const name = `read${type[0].toUpperCase()}${type.slice(1)}`

		describe(name, function () {
			it('should be the export with the name of the box type', function () {
				assert.strictEqual(typeof reader, 'function')
				assert.strictEqual((isoBmff as Record<string, unknown>)[name], reader)
			})

			it('should read the type and the child boxes', function () {
				const view = new IsoBoxReadView(MFHD, { readers: { mfhd: readMfhd } })

				deepStrictEqual(values(reader(view, type)), { type, boxes: [MFHD_VALUES] })
			})

			it('should read an empty box', function () {
				const boxes = readIsoBoxes(boxBytes(type), { readers: { [type]: reader } })

				assert.strictEqual(boxes[0].size, 8)
				deepStrictEqual(values(boxes), [{ type, boxes: [] }])
			})

			it('should give the same boxes as a configuration with no entry for the box type', function () {
				const source = boxBytes(type, MFHD)
				const expected = readIsoBoxes(source, { readers: { mfhd: readMfhd } })
				const boxes = readIsoBoxes(source, { readers: { mfhd: readMfhd, [type]: reader } })

				deepStrictEqual(values(expected), [{ type, boxes: [MFHD_VALUES] }])
				deepStrictEqual(values(boxes), values(expected))
			})
		})
	}

	it('should give the same boxes for every fixture with and without the container readers', function () {
		const config = defaultReaderConfig()
		const containerConfig = { readers: { ...config.readers, ...READERS } }

		for (const file of fixtureFiles()) {
			const source = load(file)

			deepStrictEqual(
				values(readIsoBoxes(source, containerConfig)),
				values(readIsoBoxes(source, config)),
				file,
			)
		}
	})

	it('should narrow a moov box to MovieBox in the result of readIsoBoxes', function () {
		const boxes = readIsoBoxes(load('captions.mp4'), {
			readers: { moov: readMoov, mvhd: readMvhd },
		})
		let children: MovieBoxChild[] = []

		for (const box of boxes) {
			if (box.type === 'moov') {
				children = box.boxes
			}
		}

		const mvhd = children.find(box => box.type === 'mvhd')

		assert.strictEqual(children.length, 2)
		assert.strictEqual(mvhd?.type, 'mvhd')
	})

	it('should give the child boxes bigint fields with readInt64AsBigInt', function () {
		const tfdt = boxBytes('tfdt', [1, 1], [0, 3], [EXACT, 8])
		const boxes = readIsoBoxes(boxBytes('moof', boxBytes('traf', tfdt)), {
			int64: readInt64AsBigInt,
			readers: { moof: readMoof, traf: readTraf, tfdt: readTfdt },
		})
		let value: bigint | undefined

		for (const moof of boxes) {
			if (moof.type !== 'moof') {
				continue
			}

			for (const traf of moof.boxes) {
				if (traf.type !== 'traf') {
					continue
				}

				for (const child of traf.boxes) {
					if (child.type === 'tfdt') {
						expectType<Equal<typeof child.baseMediaDecodeTime, bigint>>(true)
						value = child.baseMediaDecodeTime
					}
				}
			}
		}

		assert.strictEqual(value, EXACT)
	})
})
