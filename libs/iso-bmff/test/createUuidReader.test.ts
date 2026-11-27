import {
	assert,
	createIsoBoxReadCursor,
	createUuidReader,
	createUuidWriter,
	describe,
	it,
	readInt64AsBigInt,
	readIsoBoxes,
	readTfdt,
	readUint24,
	readUint8,
	readWideUint,
	writeIsoBoxes,
	writeUint24,
	writeUint8,
	writeWideUint,
	type IsoBoxMap,
	type IsoBoxReadCursor,
	type IsoBoxWriteCursor,
	type IsoInt64,
	type IsoUuidBoxReaderMap,
	type ParsedIsoBox,
} from './util/box.ts'
import { TEST_USER_TYPE } from './util/customBoxTypes.ts'
import { expectType, type Equal } from './util/expectType.ts'
import { boxBytes } from './util/wideBoxes.ts'

// The type check of the repo is part of this test.

// #region example
// The tfxd box of Smooth Streaming.
const TFXD = '6d1d9b05-42d5-44e6-80e2-141daff757b2'

type TfxdBox = {
	type: 'uuid'
	userType: typeof TFXD
	version: number
	flags: number
	fragmentAbsoluteTime: number
	fragmentDuration: number
}

declare module '@svta/cml-iso-bmff' {
	// oxlint-disable-next-line typescript/consistent-type-definitions
	interface IsoCustomUuidBoxMap {
		[TFXD]: TfxdBox
	}
}

const readTfxd = (cursor: IsoBoxReadCursor, userType: typeof TFXD): TfxdBox => {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)
	const size = version === 1 ? 8 : 4

	return {
		type: 'uuid',
		userType,
		version,
		flags,
		fragmentAbsoluteTime: readWideUint(cursor, size),
		fragmentDuration: readWideUint(cursor, size),
	}
}

const writeTfxd = (cursor: IsoBoxWriteCursor, box: TfxdBox): void => {
	const size = box.version === 1 ? 8 : 4

	writeUint8(cursor, box.version)
	writeUint24(cursor, box.flags)
	writeWideUint(cursor, box.fragmentAbsoluteTime, size)
	writeWideUint(cursor, box.fragmentDuration, size)
}

function readFragmentDurations(segment: Uint8Array): number[] {
	const boxes = readIsoBoxes(segment, {
		readers: { tfdt: readTfdt, uuid: createUuidReader({ [TFXD]: readTfxd }) },
	})
	const durations: number[] = []

	for (const box of boxes) {
		// The test of `userType` narrows the box to `TfxdBox`.
		if (box.type === 'uuid' && box.userType === TFXD) {
			durations.push(box.fragmentDuration)
		}
	}

	return durations
}

function writeTfxdBox(box: TfxdBox): Uint8Array {
	return writeIsoBoxes([box], { writers: { uuid: createUuidWriter({ [TFXD]: writeTfxd }) } })
}
// #endregion example

const TFXD_BYTES = new Uint8Array([
	0x6d, 0x1d, 0x9b, 0x05, 0x42, 0xd5, 0x44, 0xe6, 0x80, 0xe2, 0x14, 0x1d, 0xaf, 0xf7, 0x57, 0xb2,
])
const TEST_BYTES = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
const OTHER_BYTES = new Uint8Array(16).fill(0xee)

const TFXD_BOX = boxBytes('uuid', TFXD_BYTES, [1, 1], [0, 3], [900, 8], [20, 8])
const TEST_BOX = boxBytes('uuid', TEST_BYTES, [7, 1])
const OTHER_BOX = boxBytes('uuid', OTHER_BYTES, [7, 1])
const TFDT = boxBytes('tfdt', [1, 1], [0, 3], [5, 8])

const readTest = (cursor: IsoBoxReadCursor, userType: typeof TEST_USER_TYPE) => ({
	type: 'uuid' as const,
	userType,
	value: readUint8(cursor),
})

describe('createUuidReader', function () {
	it('should read the box of each user type', function () {
		const uuid = createUuidReader({ [TFXD]: readTfxd, [TEST_USER_TYPE]: readTest })
		const boxes = readIsoBoxes(boxBytes('moof', TFXD_BOX, TFDT, TEST_BOX), { readers: { uuid } })
		const [moof] = boxes

		assert.ok(moof?.type === 'moof')
		assert.deepStrictEqual(moof.boxes[0], {
			type: 'uuid',
			userType: TFXD,
			version: 1,
			flags: 0,
			fragmentAbsoluteTime: 900,
			fragmentDuration: 20,
		})
		assert.deepStrictEqual(moof.boxes[2], { type: 'uuid', userType: TEST_USER_TYPE, value: 7 })
	})

	it('should read the example', function () {
		assert.deepStrictEqual(
			readFragmentDurations(new Uint8Array([...TFXD_BOX, ...TFDT, ...TFXD_BOX])),
			[20, 20],
		)
	})

	it('should return a raw box for a user type with no reader', function () {
		const [box] = readIsoBoxes(OTHER_BOX, {
			readers: { uuid: createUuidReader({ [TFXD]: readTfxd }) },
		})

		assert.ok(box && !box.type)
		assert.strictEqual(box.boxType, 'uuid')
		assert.strictEqual(box.headerSize, 24)
		assert.deepStrictEqual(Array.from(box.userType ?? []), Array.from(OTHER_BYTES))
		assert.deepStrictEqual(Array.from(box.bytes), Array.from(OTHER_BOX))
	})

	it('should take the joined maps of several packages', function () {
		const readersA: IsoUuidBoxReaderMap = { [TFXD]: readTfxd }
		const readersB: IsoUuidBoxReaderMap = { [TEST_USER_TYPE]: readTest }
		const uuid = createUuidReader({ ...readersA, ...readersB })
		const boxes = readIsoBoxes(new Uint8Array([...TFXD_BOX, ...TEST_BOX]), { readers: { uuid } })

		assert.deepStrictEqual(
			boxes.map(box => (box.type === 'uuid' ? box.userType : null)),
			[TFXD, TEST_USER_TYPE],
		)
	})

	it('should return undefined for a cursor with fewer than 16 bytes', function () {
		const uuid = createUuidReader({ [TFXD]: readTfxd })
		const cursor = createIsoBoxReadCursor(TFXD_BYTES.subarray(0, 15))

		assert.strictEqual(uuid(cursor), undefined)
		assert.strictEqual(cursor.pos, 0)
	})

	it('should read a uuid box with a largesize field', function () {
		const body = TEST_BOX.subarray(8)
		const bytes = new Uint8Array(16 + body.length)
		const view = new DataView(bytes.buffer)
		view.setUint32(0, 1)
		bytes.set([0x75, 0x75, 0x69, 0x64], 4)
		view.setBigUint64(8, BigInt(bytes.length))
		bytes.set(body, 16)

		const [box] = readIsoBoxes(bytes, {
			readers: { uuid: createUuidReader({ [TEST_USER_TYPE]: readTest }) },
		})

		assert.deepStrictEqual(box, { type: 'uuid', userType: TEST_USER_TYPE, value: 7 })
	})

	it('should skip a key with no reader', function () {
		const uuid = createUuidReader({ [TFXD]: undefined })
		const [box] = readIsoBoxes(TFXD_BOX, { readers: { uuid } })

		assert.ok(box && !box.type)
	})

	it('should throw a RangeError for a key that is not a lowercase UUID', function () {
		for (const key of [
			'6D1D9B05-42D5-44E6-80E2-141DAFF757B2',
			'6d1d9b0542d544e680e2141daff757b2',
			'{6d1d9b05-42d5-44e6-80e2-141daff757b2}',
			'6d1d9b05-42d5-44e6-80e2-141daff757b',
			'',
		]) {
			const error = new RangeError(
				`createUuidReader: a user type must be a UUID in lowercase hexadecimal digits with hyphens, received "${key}"`,
			)

			assert.throws(() => createUuidReader({ [key]: readTest }), error)
			assert.throws(() => createUuidReader({ [key]: undefined }), error)
		}
	})

	it('should narrow a uuid box with one test of userType', function () {
		const [box] = readIsoBoxes(TFXD_BOX, {
			readers: { uuid: createUuidReader({ [TFXD]: readTfxd }) },
		})

		expectType<Equal<Extract<IsoBoxMap['uuid'], { userType: typeof TFXD }>, TfxdBox>>(true)

		if (box?.type === 'uuid' && box.userType === TFXD) {
			expectType<Equal<typeof box, TfxdBox>>(true)
		} else {
			assert.fail('expected a tfxd box')
		}

		const parsed: ParsedIsoBox[] = [box]

		assert.strictEqual(parsed.length, 1)
	})

	it('should take a reader of either int64 mode in the bigint mode', function () {
		const readAny = (cursor: IsoBoxReadCursor<IsoInt64>, userType: typeof TEST_USER_TYPE) => ({
			type: 'uuid' as const,
			userType,
			value: readUint8(cursor),
		})
		const [box] = readIsoBoxes(TEST_BOX, {
			int64: readInt64AsBigInt,
			readers: { uuid: createUuidReader({ [TEST_USER_TYPE]: readAny }) },
		})

		assert.deepStrictEqual(box, { type: 'uuid', userType: TEST_USER_TYPE, value: 7 })

		readIsoBoxes(TEST_BOX, {
			int64: readInt64AsBigInt,
			// @ts-expect-error A reader with a number cursor does not take the cursor of the bigint mode.
			readers: { uuid: createUuidReader({ [TEST_USER_TYPE]: readTest }) },
		})
	})

	it('should check the readers map', function () {
		const readNone = (): { type: 'uuid'; userType: 'none' } => ({ type: 'uuid', userType: 'none' })

		// @ts-expect-error `none` is not a user type of `IsoCustomUuidBoxMap`.
		assert.throws(() => createUuidReader({ none: readNone }))
		// @ts-expect-error The reader of TFXD returns the box type of TFXD.
		createUuidReader({ [TFXD]: readTest })
	})
})

describe('createUuidWriter', function () {
	it('should write the box of each user type', function () {
		const box: TfxdBox = {
			type: 'uuid',
			userType: TFXD,
			version: 1,
			flags: 0,
			fragmentAbsoluteTime: 900,
			fragmentDuration: 20,
		}

		assert.deepStrictEqual(Array.from(writeTfxdBox(box)), Array.from(TFXD_BOX))
	})

	it('should write a box that it read', function () {
		const bytes = new Uint8Array([...TFXD_BOX, ...TEST_BOX, ...OTHER_BOX])
		const boxes = readIsoBoxes(bytes, {
			readers: { uuid: createUuidReader({ [TFXD]: readTfxd, [TEST_USER_TYPE]: readTest }) },
		})
		const writeTest = (cursor: IsoBoxWriteCursor, box: { value: number }): void => {
			writeUint8(cursor, box.value)
		}
		const copy = writeIsoBoxes(boxes, {
			writers: { uuid: createUuidWriter({ [TFXD]: writeTfxd, [TEST_USER_TYPE]: writeTest }) },
		})

		assert.deepStrictEqual(Array.from(copy), Array.from(bytes))
	})

	it('should throw for a user type with no writer', function () {
		const uuid = createUuidWriter({ [TFXD]: writeTfxd })

		assert.throws(
			() =>
				writeIsoBoxes([{ type: 'uuid', userType: TEST_USER_TYPE, value: 7 }], {
					writers: { uuid },
				}),
			new Error(`No writer found for box type: uuid, user type "${TEST_USER_TYPE}"`),
		)
	})

	it('should throw a RangeError for a key that is not a lowercase UUID', function () {
		assert.throws(
			() => createUuidWriter({ 'not-a-uuid': writeTfxd } as never),
			new RangeError(
				'createUuidWriter: a user type must be a UUID in lowercase hexadecimal digits with hyphens, received "not-a-uuid"',
			),
		)
	})
})
