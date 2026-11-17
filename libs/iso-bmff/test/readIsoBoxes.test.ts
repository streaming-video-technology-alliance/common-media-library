import {
	assert,
	createAudioSampleEntryReader,
	describe,
	it,
	readFtyp,
	readIsoBoxes,
	readStsd,
	readUrl,
	type IsoBoxReadView,
} from './util/box.ts'
import { expectType, type Equal } from './util/expectType.ts'

/** A tfdt reader that keeps the 64-bit field exact. */
const readTfdt64 = (view: IsoBoxReadView) => {
	const { version, flags } = view.readFullBox()
	const baseMediaDecodeTime = version === 1 ? view.readUint64() : BigInt(view.readUint(4))
	return { type: 'tfdt' as const, version, flags, baseMediaDecodeTime, exact: true }
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
		assert.strictEqual(box.type, 'ftyp')
		assert.strictEqual(box.size, 20)
		assert.strictEqual(box.majorBrand, 'isom')
		assert.strictEqual(box.minorVersion, 1)
		assert.deepEqual(box.compatibleBrands, ['isom'])
		// #endregion example
	})

	it('should exit if garbage is zero', function () {
		const zero = new Uint8Array(1500)
		const boxes = readIsoBoxes(zero.buffer)
		assert.strictEqual(boxes.length, 1)
		assert.strictEqual(boxes[0].size, 0)
	})

	it('should allow custom box readers', function () {
		const bytes = new Uint8Array([
			0x00, 0x00, 0x00, 0x0c, 0x74, 0x65, 0x73, 0x74, 0xff, 0xff, 0xff, 0xff,
		])

		const boxes = readIsoBoxes(bytes.buffer, {
			readers: {
				test: (view: IsoBoxReadView) => ({ type: 'test', value: view.readUint(4) }),
				'ac-4': createAudioSampleEntryReader('ac-4'),
			},
		})

		const box = boxes[0]
		assert.strictEqual(box.type, 'test')
		assert.strictEqual(box.value, 0xffffffff)
	})

	it('should narrow a custom reader of a built-in box to the return type of that reader', function () {
		// A version 1 tfdt box with baseMediaDecodeTime = 2^53 + 1.
		const bytes = new Uint8Array([
			0x00, 0x00, 0x00, 0x14, 0x74, 0x66, 0x64, 0x74, 0x01, 0x00, 0x00, 0x00, 0x00, 0x20, 0x00,
			0x00, 0x00, 0x00, 0x00, 0x01,
		])
		const [box] = readIsoBoxes(bytes.buffer, { readers: { tfdt: readTfdt64 } })

		assert.ok(box)
		if (box.type === 'tfdt') {
			// The built-in tfdt type is not part of the union, so the field is a bigint,
			// not `number | bigint`, and the extra field of the custom reader is visible.
			expectType<Equal<typeof box.baseMediaDecodeTime, bigint>>(true)
			expectType<Equal<typeof box.exact, boolean>>(true)
			assert.strictEqual(box.baseMediaDecodeTime, BigInt('9007199254740993'))
			assert.strictEqual(box.exact, true)
		} else {
			assert.fail('expected a tfdt box')
		}
	})

	it('should keep the built-in box types when the reader map has no literal keys', function () {
		// A version 0 tfdt box with baseMediaDecodeTime = 1.
		const bytes = new Uint8Array([
			0x00, 0x00, 0x00, 0x10, 0x74, 0x66, 0x64, 0x74, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x01,
		])
		const name: string = 'ftyp'
		// The key is not a literal, so `keyof` the map is `string` and no built-in type is excluded.
		const [box] = readIsoBoxes(bytes.buffer, { readers: { [name]: readFtyp } })

		assert.ok(box)
		if (box.type === 'tfdt') {
			expectType<Equal<typeof box.baseMediaDecodeTime, number>>(true)
		} else {
			assert.fail('expected a tfdt box')
		}
	})

	it('should keep the built-in box type when its reader is optional', function () {
		// A version 0 tfdt box with baseMediaDecodeTime = 1.
		const bytes = new Uint8Array([
			0x00, 0x00, 0x00, 0x10, 0x74, 0x66, 0x64, 0x74, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
			0x01,
		])
		const readers: { tfdt?: typeof readTfdt64 } = {}

		const boxes = readIsoBoxes(bytes.buffer, { readers })
		const [box] = boxes

		// An absent reader does not add `undefined` to the union.
		expectType<Equal<undefined extends (typeof boxes)[number] ? true : false, false>>(true)
		assert.ok(box)
		// The reader may be absent, so the union has the built-in tfdt type next to the custom type.
		if (box.type === 'tfdt') {
			expectType<Equal<typeof box.baseMediaDecodeTime, number | bigint>>(true)
		} else {
			assert.fail('expected a tfdt box')
		}

		readers.tfdt = readTfdt64
		const [exact] = readIsoBoxes(bytes.buffer, { readers })

		assert.ok(exact)
		if (exact.type === 'tfdt') {
			assert.strictEqual(exact.baseMediaDecodeTime, BigInt(1))
		} else {
			assert.fail('expected a tfdt box')
		}
	})

	it('should exclude the built-in url box type for a trimmed url key', function () {
		// A 'url ' box with the self-contained flag set and no location.
		const bytes = new Uint8Array([
			0x00, 0x00, 0x00, 0x0c, 0x75, 0x72, 0x6c, 0x20, 0x00, 0x00, 0x00, 0x01,
		])
		const readUrlCustom = (view: IsoBoxReadView) => ({
			...readUrl(view),
			custom: true,
		})

		// The view also finds a reader by the trimmed type, so `url` replaces `'url '`.
		const [box] = readIsoBoxes(bytes.buffer, { readers: { url: readUrlCustom } })

		assert.ok(box)
		if (box.type === 'url ') {
			expectType<Equal<typeof box.custom, boolean>>(true)
			assert.strictEqual(box.custom, true)
		} else {
			assert.fail('expected a url box')
		}
	})
})
