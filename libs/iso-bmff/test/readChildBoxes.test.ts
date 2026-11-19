import {
	assert,
	createIsoBoxReadCursor,
	describe,
	isIsoBoxType,
	it,
	nextIsoBox,
	readBytes,
	readChildBoxes,
	readIsoBoxes,
	readMfhd,
	readUint32,
	readUint8,
	type IsoBoxReadCursor,
	type IsoRawBox,
} from './util/box.ts'
import { reduceUint8Arrays } from './util/reduceUint8Arrays.ts'
import { boxBytes } from './util/wideBoxes.ts'

const USERTYPE = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
const MFHD = boxBytes('mfhd', new Uint8Array([0, 0, 0, 0, 0, 0, 0, 7]))
const MDAT = boxBytes('mdat', new Uint8Array([0xaa, 0xbb]))

function nest(depth: number): Uint8Array {
	let bytes: Uint8Array = boxBytes('free')

	for (let i = 0; i < depth; i++) {
		bytes = boxBytes('moov', bytes)
	}

	return bytes
}

describe('readIsoBoxes on the read cursor', function () {
	it('should return a raw box for a box with no reader', function () {
		// #region raw
		const [mdat] = readIsoBoxes(MDAT) as IsoRawBox[]

		const body = mdat?.bytes.subarray(mdat.headerSize) // aa bb
		// #endregion raw

		assert.strictEqual(mdat?.type, 'mdat')
		assert.strictEqual(mdat?.headerSize, 8)
		assert.deepStrictEqual(Array.from(mdat?.bytes ?? []), Array.from(MDAT))
		assert.strictEqual(mdat?.bytes.buffer, MDAT.buffer)
		assert.deepStrictEqual(Array.from(body ?? []), [0xaa, 0xbb])
		assert.strictEqual('usertype' in (mdat ?? {}), false)
	})

	it('should add the byte offset of a subarray input to a raw box', function () {
		const input = reduceUint8Arrays([new Uint8Array(3), MDAT])
		const [mdat] = readIsoBoxes(input.subarray(3)) as IsoRawBox[]

		assert.strictEqual(mdat?.bytes.byteOffset, 3)
		assert.deepStrictEqual(Array.from(mdat?.bytes ?? []), Array.from(MDAT))
	})

	it('should set the header size of a raw box with a largesize', function () {
		const large = new Uint8Array(18)
		const view = new DataView(large.buffer)

		view.setUint32(0, 1)
		view.setUint32(4, 0x6d646174) // mdat
		view.setUint32(12, 18)

		const [mdat] = readIsoBoxes(large) as IsoRawBox[]

		assert.strictEqual(mdat?.headerSize, 16)
		assert.strictEqual(mdat?.bytes.length, 18)
	})

	it('should set headerSize and usertype on a raw uuid box', function () {
		const uuid = boxBytes('uuid', USERTYPE, new Uint8Array([0xcc]))
		const [box] = readIsoBoxes(uuid) as IsoRawBox[]

		assert.strictEqual(box?.headerSize, 24)
		assert.deepStrictEqual(Array.from(box?.usertype ?? []), Array.from(USERTYPE))
		assert.strictEqual(box?.usertype?.buffer, uuid.buffer)
	})

	it('should start the cursor of a uuid reader at usertype', function () {
		const uuid = boxBytes('uuid', USERTYPE, new Uint8Array([0xcc]))
		const readers = {
			uuid: (cursor: IsoBoxReadCursor) => ({
				type: 'uuid' as const,
				usertype: readBytes(cursor, 16),
				value: readUint8(cursor),
			}),
		}

		const [box] = readIsoBoxes(uuid, { readers })

		assert.deepStrictEqual(
			Array.from(box?.type === 'uuid' && 'value' in box ? box.usertype : []),
			Array.from(USERTYPE),
		)
		assert.strictEqual(box && 'value' in box ? box.value : 0, 0xcc)
	})

	it('should use the result of a reader with no merge', function () {
		const [mfhd] = readIsoBoxes(MFHD, { readers: { mfhd: readMfhd } })

		assert.deepStrictEqual(mfhd, { type: 'mfhd', version: 0, flags: 0, sequenceNumber: 7 })
	})

	it('should read the child boxes of a container with no reader', function () {
		const [moof] = readIsoBoxes(boxBytes('moof', MFHD, MDAT), { readers: { mfhd: readMfhd } })

		assert.strictEqual(moof?.type, 'moof')
		assert.deepStrictEqual(moof && 'boxes' in moof ? moof.boxes.map(box => box.type) : [], [
			'mfhd',
			'mdat',
		])
	})

	it('should throw a RangeError for a reader that reads past its box', function () {
		const short = boxBytes('mfhd', new Uint8Array(4))
		const readers = { mfhd: readMfhd }

		assert.throws(() => readIsoBoxes(boxBytes('moof', short, MDAT), { readers }), RangeError)
	})

	it('should not catch an error of a reader', function () {
		const error = new Error('Truncated box')
		const readers = {
			mfhd: (): never => {
				throw error
			},
		}

		assert.throws(
			() => readIsoBoxes(boxBytes('moof', MFHD, MDAT), { readers }),
			(thrown: unknown) => thrown === error,
		)
	})

	it('should restore the cursor to the first byte of the box after an error of a reader', function () {
		const readers = { mfhd: (cursor: IsoBoxReadCursor) => readBytes(cursor, 9) as never }
		const bytes = reduceUint8Arrays([MDAT, MFHD, boxBytes('free')])
		const cursor = createIsoBoxReadCursor(bytes, { readers })

		assert.throws(() => readChildBoxes(cursor), RangeError)
		assert.strictEqual(cursor.start, 0)
		assert.strictEqual(cursor.pos, MDAT.length)
		assert.strictEqual(cursor.end, bytes.length)
		assert.strictEqual(nextIsoBox(cursor), 'mfhd')
		assert.deepStrictEqual(
			readChildBoxes(cursor).map(box => box.type),
			['free'],
		)
	})

	it('should restore the cursor to the first byte of the box after the depth error', function () {
		const bytes = nest(128)
		const cursor = createIsoBoxReadCursor(bytes)

		assert.throws(() => readChildBoxes(cursor), /128/)
		assert.strictEqual(cursor.pos, 0)
		assert.strictEqual(cursor.end, bytes.length)
		assert.strictEqual(readChildBoxes(cursor, 0).length, 0)
	})

	it('should set the position to the end of the box after a reader', function () {
		const readers = {
			mfhd: (cursor: IsoBoxReadCursor) => ({ type: 'mfhd' as const, first: readUint8(cursor) }),
		}
		const boxes = readIsoBoxes(reduceUint8Arrays([MFHD, MDAT]), { readers })

		assert.deepStrictEqual(
			boxes.map(box => box.type),
			['mfhd', 'mdat'],
		)
	})

	it('should read 128 levels and throw a RangeError at 129 levels', function () {
		assert.strictEqual(readIsoBoxes(nest(127)).length, 1)
		assert.throws(() => readIsoBoxes(nest(128)), /free.*128/)
	})

	it('should stop with no error before a box with a largesize past the data', function () {
		const large = new Uint8Array(24)
		const view = new DataView(large.buffer)

		view.setUint32(0, 1)
		view.setUint32(4, 0x6d646174) // mdat
		view.setUint32(8, 0x10000000) // a largesize of 2^60

		const boxes = readIsoBoxes(reduceUint8Arrays([MDAT, large]))

		assert.deepStrictEqual(
			boxes.map(box => box.type),
			['mdat'],
		)
	})

	it('should return false from isIsoBoxType for a raw box', function () {
		const [mfhd] = readIsoBoxes(MFHD)

		assert.strictEqual(mfhd?.type, 'mfhd')
		assert.strictEqual(isIsoBoxType('mfhd', mfhd), false)
	})
})

describe('readChildBoxes', function () {
	it('should read the boxes from the position to the end', function () {
		// #region example
		// A cursor at the first child box of a box.
		const cursor = createIsoBoxReadCursor(reduceUint8Arrays([MFHD, MDAT]))

		const boxes = readChildBoxes(cursor) // a raw mfhd box and a raw mdat box
		// #endregion example

		assert.deepStrictEqual(
			boxes.map(box => box.type),
			['mfhd', 'mdat'],
		)
		assert.strictEqual(cursor.pos, cursor.end)
	})

	it('should read at most count boxes', function () {
		const cursor = createIsoBoxReadCursor(reduceUint8Arrays([MFHD, MDAT]))

		assert.deepStrictEqual(
			readChildBoxes(cursor, 1).map(box => box.type),
			['mfhd'],
		)
		assert.strictEqual(cursor.pos, MFHD.length)
		assert.strictEqual(readChildBoxes(cursor, 0).length, 0)
	})

	it('should throw a RangeError for a negative count or NaN', function () {
		assert.throws(() => readChildBoxes(createIsoBoxReadCursor(MFHD), -1), RangeError)
		assert.throws(() => readChildBoxes(createIsoBoxReadCursor(MFHD), NaN), /NaN/)
	})

	it('should stop at the first byte of a truncated box', function () {
		const bytes = reduceUint8Arrays([MFHD, MDAT.subarray(0, 9)])
		const cursor = createIsoBoxReadCursor(bytes)

		assert.strictEqual(readChildBoxes(cursor).length, 1)
		assert.strictEqual(cursor.pos, MFHD.length)
	})

	it('should use the readers of the cursor', function () {
		const cursor = createIsoBoxReadCursor(MFHD, { readers: { mfhd: readMfhd } })
		const [mfhd] = readChildBoxes(cursor)

		assert.ok(isIsoBoxType('mfhd', mfhd))
		assert.strictEqual(mfhd.sequenceNumber, 7)
		assert.strictEqual(readUint32(createIsoBoxReadCursor(MFHD)), MFHD.length)
	})
})
