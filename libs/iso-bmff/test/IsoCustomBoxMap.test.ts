import {
	assert,
	beginIsoBox,
	createAudioSampleEntryReader,
	createVisualSampleEntryReader,
	describe,
	endIsoBox,
	filterIsoBoxes,
	findIsoBox,
	isIsoBoxType,
	it,
	readInt64AsBigInt,
	readIsoBoxes,
	readTfdt,
	readUint32,
	writeIsoBoxes,
	writeUint32,
	type IsoBoxMap,
	type IsoBoxReadCursor,
	type IsoBoxReaderMap,
	type IsoBoxWriteCursor,
	type IsoRawBox,
	type ParsedIsoBox,
	type TrackFragmentBaseMediaDecodeTimeBox,
} from './util/box.ts'
import { expectType, type Equal } from './util/expectType.ts'
import { boxBytes } from './util/wideBoxes.ts'

// The type check of the repo is part of this test.

type CustomBox = { type: 'cstm'; value: number }

declare module '@svta/cml-iso-bmff' {
	// oxlint-disable-next-line typescript/consistent-type-definitions
	interface IsoCustomBoxMap {
		cstm: CustomBox
	}
}

// #region example
const readCstm = (cursor: IsoBoxReadCursor): CustomBox => ({
	type: 'cstm',
	value: readUint32(cursor),
})

const writeCstm = (cursor: IsoBoxWriteCursor, box: CustomBox): void => {
	const start = beginIsoBox(cursor, box.type)
	writeUint32(cursor, box.value)
	endIsoBox(cursor, start)
}

function readValues(bytes: Uint8Array): number[] {
	const boxes = readIsoBoxes(bytes, { readers: { cstm: readCstm } })

	// The guard narrows each box to `CustomBox`.
	return filterIsoBoxes(boxes, box => isIsoBoxType('cstm', box)).map(box => box.value)
}

function writeValue(value: number): Uint8Array {
	return writeIsoBoxes([{ type: 'cstm', value }], { writers: { cstm: writeCstm } })
}
// #endregion example

const CSTM = boxBytes('cstm', [7, 4])
const TFDT = boxBytes('tfdt', [1, 1], [0, 3], [5, 8])
const MDAT = boxBytes('mdat', [0xaabb, 2])

describe('IsoCustomBoxMap', function () {
	it('should read and write a custom box type', function () {
		assert.deepStrictEqual(readValues(CSTM), [7])
		assert.deepStrictEqual([...writeValue(7)], [...CSTM])
	})

	it('should add the custom box type to IsoBoxMap', function () {
		expectType<Equal<IsoBoxMap['cstm'], CustomBox>>(true)
		expectType<Equal<Extract<ParsedIsoBox, { type: 'cstm' }>, CustomBox>>(true)
	})

	it('should narrow a box with isIsoBoxType and not with a test of the type field', function () {
		const [moof] = readIsoBoxes(boxBytes('moof', CSTM, TFDT), {
			readers: { cstm: readCstm, tfdt: readTfdt },
		})

		assert.ok(isIsoBoxType('moof', moof))

		const [custom, time] = moof.boxes

		assert.ok(custom && time)

		// A test of `type` also matches a raw box, so the test does not narrow to the box type.
		assert.deepStrictEqual([custom.type, time.type], ['cstm', 'tfdt'])

		if (custom.type === 'cstm') {
			expectType<Equal<typeof custom, CustomBox | IsoRawBox>>(true)
			// @ts-expect-error A raw box has no `value` field.
			assert.strictEqual(custom.value, 7)
		}

		if (time.type === 'tfdt') {
			expectType<Equal<typeof time, TrackFragmentBaseMediaDecodeTimeBox | IsoRawBox>>(true)
			// @ts-expect-error A raw box has no `baseMediaDecodeTime` field.
			assert.strictEqual(time.baseMediaDecodeTime, 5)
		}

		if (isIsoBoxType('cstm', custom)) {
			expectType<Equal<typeof custom, CustomBox>>(true)
			assert.strictEqual(custom.value, 7)
		} else {
			assert.fail('expected a cstm box')
		}

		if (isIsoBoxType('tfdt', time)) {
			expectType<Equal<typeof time, TrackFragmentBaseMediaDecodeTimeBox>>(true)
			assert.strictEqual(time.baseMediaDecodeTime, 5)
		} else {
			assert.fail('expected a tfdt box')
		}
	})

	it('should narrow a box in bigint mode', function () {
		const [box] = readIsoBoxes(TFDT, { int64: readInt64AsBigInt, readers: { tfdt: readTfdt } })

		if (isIsoBoxType('tfdt', box)) {
			expectType<Equal<typeof box, TrackFragmentBaseMediaDecodeTimeBox<bigint>>>(true)
			assert.strictEqual(box.baseMediaDecodeTime, BigInt(5))
		} else {
			assert.fail('expected a tfdt box')
		}
	})

	it('should narrow the result of findIsoBox and filterIsoBoxes with an isIsoBoxType callback and not with a plain callback', function () {
		const boxes = readIsoBoxes(boxBytes('moof', CSTM, TFDT), {
			readers: { cstm: readCstm, tfdt: readTfdt },
		})

		const time = findIsoBox(boxes, box => isIsoBoxType('tfdt', box))
		expectType<Equal<typeof time, TrackFragmentBaseMediaDecodeTimeBox | null>>(true)
		assert.strictEqual(time?.baseMediaDecodeTime, 5)

		const custom = filterIsoBoxes(boxes, box => isIsoBoxType('cstm', box))
		expectType<Equal<typeof custom, CustomBox[]>>(true)
		assert.deepStrictEqual(custom, [{ type: 'cstm', value: 7 }])

		assert.ok(isIsoBoxType('cstm', custom[0]))

		// A callback that tests `type` also matches a raw box, so the result keeps the type of the input.
		const plainTime = findIsoBox(boxes, box => box.type === 'tfdt')
		expectType<Equal<typeof plainTime, ParsedIsoBox | null>>(true)
		assert.strictEqual(plainTime, time)

		const plainCustom = filterIsoBoxes(boxes, box => box.type === 'cstm')
		expectType<Equal<typeof plainCustom, ParsedIsoBox[]>>(true)
		assert.deepStrictEqual(plainCustom, custom)
	})

	it('should give a raw box the type of its box', function () {
		const [box] = readIsoBoxes(MDAT)

		assert.ok(box)

		// A test of `type` matches a raw box. `isIsoBoxType` does not.
		assert.strictEqual(box.type, 'mdat')
		assert.strictEqual(box.type === 'mdat', true)
		assert.strictEqual(isIsoBoxType('mdat', box), false)

		if ('bytes' in box) {
			expectType<Equal<typeof box, IsoRawBox>>(true)
			assert.strictEqual(box.type, 'mdat')
			assert.deepStrictEqual([...box.bytes.subarray(box.headerSize)], [0xaa, 0xbb])
		} else {
			assert.fail('expected a raw box')
		}
	})

	it('should check a box object in a write', function () {
		const writers = { cstm: writeCstm }
		const raw: IsoRawBox = { type: 'mdat', bytes: MDAT }

		assert.deepStrictEqual(
			[...writeIsoBoxes([{ type: 'cstm', value: 7 }, raw, MDAT], { writers })],
			[...CSTM, ...MDAT, ...MDAT],
		)

		// @ts-expect-error The `cstm` box has a `value` field.
		assert.throws(() => writeIsoBoxes([{ type: 'cstm' }], { writers: {} }))
		// @ts-expect-error `none` is not a box type of `IsoBoxMap`.
		assert.throws(() => writeIsoBoxes([{ type: 'none', value: 7 }], { writers: {} }))
		// @ts-expect-error A raw box has a `type` field. The write still copies the bytes.
		const copy = writeIsoBoxes([{ bytes: MDAT }], { writers: {} })

		assert.deepStrictEqual([...copy], [...MDAT])
	})

	it('should take a reader for each codec sample entry type with no declaration', function () {
		const readers: IsoBoxReaderMap = {
			'ac-3': createAudioSampleEntryReader('ac-3'),
			'ac-4': createAudioSampleEntryReader('ac-4'),
			av01: createVisualSampleEntryReader('av01'),
			dav1: createVisualSampleEntryReader('dav1'),
			dva1: createVisualSampleEntryReader('dva1'),
			dvav: createVisualSampleEntryReader('dvav'),
			dvh1: createVisualSampleEntryReader('dvh1'),
			dvhe: createVisualSampleEntryReader('dvhe'),
			'ec-3': createAudioSampleEntryReader('ec-3'),
			fLaC: createAudioSampleEntryReader('fLaC'),
			Opus: createAudioSampleEntryReader('Opus'),
			vp09: createVisualSampleEntryReader('vp09'),
		}

		assert.strictEqual(Object.keys(readers).length, 12)
	})

	it('should check the readers map and the writers map', function () {
		const readNone = (): { type: 'none' } => ({ type: 'none' })
		const readOther = (): { type: 'cstm'; other: string } => ({ type: 'cstm', other: '' })

		// @ts-expect-error `none` is not a box type of `IsoBoxMap`.
		assert.strictEqual(readIsoBoxes(CSTM, { readers: { none: readNone } }).length, 1)
		// @ts-expect-error The reader of `cstm` returns the `cstm` box type.
		assert.strictEqual(readIsoBoxes(CSTM, { readers: { cstm: readOther } }).length, 1)
		// @ts-expect-error `none` is not a box type of `IsoBoxMap`.
		assert.strictEqual(writeIsoBoxes([], { writers: { none: writeCstm } }).length, 0)
	})
})
