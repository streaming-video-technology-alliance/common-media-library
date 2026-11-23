import { runInNewContext } from 'node:vm'
import {
	assert,
	createAudioSampleEntryReader,
	describe,
	isIsoBoxType,
	it,
	readFtyp,
	readIsoBoxes,
	readStsd,
	readTfdt,
	readUint24,
	readUint32,
	readUint64,
	readUint8,
	readUrl,
	type IsoBoxReadCursor,
	type IsoRawBox,
} from './util/box.ts'
import { expectType, type Equal } from './util/expectType.ts'

/** A tfdt reader that adds a field to the built-in box type. */
const readTfdtExact = (cursor: IsoBoxReadCursor) => ({ ...readTfdt(cursor), exact: true })

/** A tfdt reader with a 64-bit field of another type than the built-in box type. */
const readTfdt64 = (cursor: IsoBoxReadCursor) => {
	const version = readUint8(cursor)
	const flags = readUint24(cursor)
	const baseMediaDecodeTime = version === 1 ? readUint64(cursor) : BigInt(readUint32(cursor))
	return { type: 'tfdt' as const, version, flags, baseMediaDecodeTime }
}

describe('readIsoBoxes', function () {
	it('should read a buffer', function () {
		// #region example
		// Sample 'ftyp' box (20 bytes)
		const bytes = new Uint8Array([
			0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x00,
			0x01, 0x69, 0x73, 0x6f, 0x6d,
		])
		const boxes = readIsoBoxes(bytes.buffer, { readers: { ftyp: readFtyp, stsd: readStsd } })

		assert.strictEqual(boxes.length, 1)

		const box = boxes[0]
		assert.ok(isIsoBoxType('ftyp', box))
		assert.strictEqual(box.majorBrand, 'isom')
		assert.strictEqual(box.minorVersion, 1)
		assert.deepStrictEqual(box.compatibleBrands, ['isom'])
		// #endregion example
	})

	it('should exit if garbage is zero', function () {
		const zero = new Uint8Array(1500)
		const boxes = readIsoBoxes(zero.buffer)
		const [box] = boxes

		// A size of 0 extends the box to the end of the data.
		assert.strictEqual(boxes.length, 1)
		assert.ok(box && 'bytes' in box)
		assert.strictEqual(box.bytes.length, 1500)
	})

	it('should allow custom box readers', function () {
		const bytes = new Uint8Array([
			0x00, 0x00, 0x00, 0x0c, 0x74, 0x65, 0x73, 0x74, 0xff, 0xff, 0xff, 0xff,
		])

		const boxes = readIsoBoxes(bytes.buffer, {
			readers: {
				test: (cursor: IsoBoxReadCursor) => ({ type: 'test', value: readUint32(cursor) }),
				'ac-4': createAudioSampleEntryReader('ac-4'),
			},
		})

		const box = boxes[0]
		assert.strictEqual(box.type, 'test')
		assert.ok('value' in box)
		assert.strictEqual(box.value, 0xffffffff)
	})

	it('should accept a custom reader that adds a field to a built-in box type', function () {
		// A version 0 tfdt box with baseMediaDecodeTime = 1.
		const bytes = new Uint8Array([
			0x00, 0x00, 0x00, 0x10, 0x74, 0x66, 0x64, 0x74, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x01,
		])
		const [box] = readIsoBoxes(bytes.buffer, { readers: { tfdt: readTfdtExact } })

		assert.ok(box)
		if (box.type === 'tfdt') {
			expectType<Equal<typeof box.baseMediaDecodeTime, number>>(true)
			assert.strictEqual(box.baseMediaDecodeTime, 1)
			assert.strictEqual('exact' in box && box.exact, true)
		} else {
			assert.fail('expected a tfdt box')
		}
	})

	it('should reject a custom reader with another box type for a built-in box type', function () {
		// A version 1 tfdt box with baseMediaDecodeTime = 2^53 + 1.
		const bytes = new Uint8Array([
			0x00, 0x00, 0x00, 0x14, 0x74, 0x66, 0x64, 0x74, 0x01, 0x00, 0x00, 0x00, 0x00, 0x20, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x01,
		])
		// @ts-expect-error The reader returns a bigint field. The tfdt box of this read has a number field.
		const [box] = readIsoBoxes(bytes.buffer, { readers: { tfdt: readTfdt64 } })

		// The read still calls the reader.
		assert.deepStrictEqual(box, {
			type: 'tfdt',
			version: 1,
			flags: 0,
			baseMediaDecodeTime: BigInt('9007199254740993'),
		})
	})

	it('should accept a reader map with a computed key', function () {
		// A version 0 tfdt box with baseMediaDecodeTime = 1.
		const bytes = new Uint8Array([
			0x00, 0x00, 0x00, 0x10, 0x74, 0x66, 0x64, 0x74, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x01,
		])
		const name: string = 'tfdt'
		const [box] = readIsoBoxes(bytes.buffer, { readers: { [name]: readTfdt } })

		assert.ok(box)
		if (box.type === 'tfdt' && 'baseMediaDecodeTime' in box) {
			expectType<Equal<typeof box.baseMediaDecodeTime, number>>(true)
			assert.strictEqual(box.baseMediaDecodeTime, 1)
		} else {
			assert.fail('expected a tfdt box')
		}
	})

	it('should give a raw box when an optional reader is absent', function () {
		// A version 0 tfdt box with baseMediaDecodeTime = 1.
		const bytes = new Uint8Array([
			0x00, 0x00, 0x00, 0x10, 0x74, 0x66, 0x64, 0x74, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x01,
		])
		const readers: { tfdt?: typeof readTfdtExact } = {}

		const boxes = readIsoBoxes(bytes.buffer, { readers })
		const [box] = boxes

		// An absent reader does not add `undefined` to the union.
		expectType<Equal<undefined extends (typeof boxes)[number] ? true : false, false>>(true)
		// A box with no reader is a raw box.
		expectType<Equal<IsoRawBox extends (typeof boxes)[number] ? true : false, true>>(true)
		assert.ok(box && !box.type)
		assert.strictEqual(box.boxType, 'tfdt')
		assert.strictEqual(box.bytes.length, 16)

		readers.tfdt = readTfdtExact
		const [exact] = readIsoBoxes(bytes.buffer, { readers })

		assert.ok(exact)
		if (exact.type === 'tfdt') {
			assert.strictEqual(exact.baseMediaDecodeTime, 1)
		} else {
			assert.fail('expected a tfdt box')
		}
	})

	it('should find a reader by a trimmed url key', function () {
		// A 'url ' box with the self-contained flag set and no location.
		const bytes = new Uint8Array([
			0x00, 0x00, 0x00, 0x0c, 0x75, 0x72, 0x6c, 0x20, 0x00, 0x00, 0x00, 0x01,
		])
		const readUrlCustom = (cursor: IsoBoxReadCursor) => ({
			...readUrl(cursor),
			custom: true,
		})

		// The read also finds a reader by the trimmed type.
		const [box] = readIsoBoxes(bytes.buffer, { readers: { url: readUrlCustom } })

		assert.ok(box)
		if (box.type === 'url ' && 'custom' in box) {
			assert.strictEqual(box.custom, true)
		} else {
			assert.fail('expected a url box')
		}
	})

	it('should read an ArrayBuffer from another realm', function () {
		const buffer = runInNewContext(
			'new Uint8Array([0, 0, 0, 8, 102, 114, 101, 101]).buffer',
		) as ArrayBuffer
		const boxes = readIsoBoxes(buffer)
		const [box] = boxes

		assert.strictEqual(boxes.length, 1)
		assert.ok(box && !box.type)
		assert.strictEqual(box.boxType, 'free')
		assert.strictEqual(box.bytes.length, 8)
	})

	it('should read a DataView that starts at a byte offset', function () {
		const bytes = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0, 0, 0, 8, 102, 114, 101, 101])
		const boxes = readIsoBoxes(new DataView(bytes.buffer, 4, 8))
		const [box] = boxes

		assert.strictEqual(boxes.length, 1)
		assert.ok(box && !box.type)
		assert.strictEqual(box.boxType, 'free')
		assert.strictEqual(box.bytes.length, 8)
		assert.strictEqual(box.bytes.byteOffset, 4)
	})
})
