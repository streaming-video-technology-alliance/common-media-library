import {
	assert,
	beginIsoBox,
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

	// The callback narrows each box to `CustomBox`.
	return filterIsoBoxes(boxes, box => box.type === 'cstm').map(box => box.value)
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

	it('should narrow a box with one test of the type field', function () {
		const [moof] = readIsoBoxes(boxBytes('moof', CSTM, TFDT), {
			readers: { cstm: readCstm, tfdt: readTfdt },
		})

		assert.ok(moof?.type === 'moof')

		const [custom, time] = moof.boxes

		assert.ok(custom && time)

		if (custom.type === 'cstm') {
			expectType<Equal<typeof custom, CustomBox>>(true)
			assert.strictEqual(custom.value, 7)
		} else {
			assert.fail('expected a cstm box')
		}

		if (time.type === 'tfdt') {
			expectType<Equal<typeof time, TrackFragmentBaseMediaDecodeTimeBox>>(true)
			assert.strictEqual(time.baseMediaDecodeTime, 5)
		} else {
			assert.fail('expected a tfdt box')
		}
	})

	it('should narrow a box in bigint mode', function () {
		const [box] = readIsoBoxes(TFDT, { int64: readInt64AsBigInt, readers: { tfdt: readTfdt } })

		if (box?.type === 'tfdt') {
			expectType<Equal<typeof box, TrackFragmentBaseMediaDecodeTimeBox<bigint>>>(true)
			assert.strictEqual(box.baseMediaDecodeTime, BigInt(5))
		} else {
			assert.fail('expected a tfdt box')
		}
	})

	it('should narrow the result of findIsoBox and filterIsoBoxes with a plain callback', function () {
		const boxes = readIsoBoxes(boxBytes('moof', CSTM, TFDT), {
			readers: { cstm: readCstm, tfdt: readTfdt },
		})

		const time = findIsoBox(boxes, box => box.type === 'tfdt')
		expectType<Equal<typeof time, TrackFragmentBaseMediaDecodeTimeBox | null>>(true)
		assert.strictEqual(time?.baseMediaDecodeTime, 5)

		const custom = filterIsoBoxes(boxes, box => box.type === 'cstm')
		expectType<Equal<typeof custom, CustomBox[]>>(true)
		assert.deepStrictEqual(custom, [{ type: 'cstm', value: 7 }])

		assert.ok(isIsoBoxType('cstm', custom[0]))
	})

	it('should give a raw box no type field', function () {
		const [box] = readIsoBoxes(MDAT)

		assert.ok(box)

		// A test of `type` does not match a raw box.
		assert.strictEqual(box.type === 'mdat', false)
		assert.strictEqual(box.type ?? box.boxType, 'mdat')

		if (!box.type) {
			expectType<Equal<typeof box, IsoRawBox>>(true)
			assert.strictEqual(box.boxType, 'mdat')
			assert.deepStrictEqual([...box.bytes.subarray(box.headerSize)], [0xaa, 0xbb])
		} else {
			assert.fail('expected a raw box')
		}
	})

	it('should check a box object in a write', function () {
		const writers = { cstm: writeCstm }
		const raw: IsoRawBox = { boxType: 'mdat', bytes: MDAT }

		assert.deepStrictEqual(
			[...writeIsoBoxes([{ type: 'cstm', value: 7 }, raw, MDAT], { writers })],
			[...CSTM, ...MDAT, ...MDAT],
		)

		// @ts-expect-error The `cstm` box has a `value` field.
		assert.throws(() => writeIsoBoxes([{ type: 'cstm' }], { writers: {} }))
		// @ts-expect-error `none` is not a box type of `IsoBoxMap`.
		assert.throws(() => writeIsoBoxes([{ type: 'none', value: 7 }], { writers: {} }))
		// @ts-expect-error A raw box has no `type` field. The write still copies the bytes.
		const copy = writeIsoBoxes([{ type: 'mdat', bytes: MDAT }], { writers: {} })

		assert.deepStrictEqual([...copy], [...MDAT])
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
