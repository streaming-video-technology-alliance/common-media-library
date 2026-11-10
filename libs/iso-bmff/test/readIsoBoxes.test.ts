import { readFile } from 'fs/promises'
import {
	assert,
	createAudioSampleEntryReader,
	defaultReaderConfig,
	describe,
	findIsoBox,
	it,
	readFtyp,
	readIsoBoxes,
	readStsd,
	readTfdt,
	readUrl,
	type Box,
	type FileTypeBox,
	type IsoBoxContainer,
	type IsoBoxReaderMap,
	type IsoBoxReadView,
	type MovieFragmentBox,
	type ParsedBox,
	type ParsedIsoBox,
	type TrackFragmentBaseMediaDecodeTimeBox,
} from './util/box.ts'

/** `true` when `A` and `B` are the same type, otherwise `false`. */
type Equal<A, B> =
	(<X>() => X extends A ? 1 : 2) extends <X>() => X extends B ? 1 : 2 ? true : false

/** Compile-time assertion. `expectType<Equal<A, B>>(true)` compiles only when `A` and `B` are the same type. */
function expectType<T>(value: T): T {
	return value
}

/** The boxes that the view returns without a reader: a container with its children, or a header-only box. */
type HeaderOnlyBox = ParsedBox<IsoBoxContainer | Box>

/** A tfdt reader that keeps the 64-bit field exact. */
const readTfdt64 = (view: IsoBoxReadView) => {
	const { version, flags } = view.readFullBox()
	const baseMediaDecodeTime = version === 1 ? view.readUint64() : BigInt(view.readUint(4))
	return { type: 'tfdt' as const, version, flags, baseMediaDecodeTime, exact: true }
}

// A version 0 tfdt box with baseMediaDecodeTime = 1.
const TFDT_V0 = new Uint8Array([
	0x00, 0x00, 0x00, 0x10, 0x74, 0x66, 0x64, 0x74, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
])

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

	it('should type only the boxes that the reader map parses', async function () {
		const isoFile = await readFile(new URL('./fixtures/test_frag.mp4', import.meta.url))
		const boxes = readIsoBoxes(new Uint8Array(isoFile), { readers: { ftyp: readFtyp } })

		// The union has the ftyp type, the container types, and the header-only type. No other built-in type.
		expectType<Equal<(typeof boxes)[number], ParsedBox<FileTypeBox> | HeaderOnlyBox>>(true)

		const [ftyp, moov] = boxes
		assert.ok(ftyp)
		assert.ok(moov)

		if (ftyp.type === 'ftyp') {
			assert.strictEqual(ftyp.majorBrand, 'isom')
		} else {
			assert.fail('expected a ftyp box')
		}

		if (moov.type === 'moov') {
			const mvhd = moov.boxes[0]
			assert.ok(mvhd)
			assert.strictEqual(mvhd.type, 'mvhd')
			// No reader ran for mvhd, so the box has only its header fields.
			assert.deepStrictEqual(Object.keys(mvhd).sort(), ['size', 'type', 'view'])
		} else {
			assert.fail('expected a moov box')
		}

		for (const box of boxes) {
			// @ts-expect-error The map has no mvhd reader, so the union has no mvhd type.
			if (box.type === 'mvhd') {
				assert.fail('mvhd is a child of moov')
			}
		}
	})

	it('should type every built-in box with defaultReaderConfig', async function () {
		const isoFile = await readFile(new URL('./fixtures/test_frag.mp4', import.meta.url))
		const boxes = readIsoBoxes(new Uint8Array(isoFile), defaultReaderConfig())

		const [ftyp] = boxes
		assert.ok(ftyp)
		if (ftyp.type === 'ftyp') {
			expectType<Equal<typeof ftyp, ParsedBox<FileTypeBox>>>(true)
			assert.strictEqual(ftyp.majorBrand, 'isom')
		} else {
			assert.fail('expected a ftyp box')
		}

		// moof has no reader. The container types stay in the union.
		const moof = findIsoBox(boxes, box => box.type === 'moof')
		assert.ok(moof)
		expectType<Equal<typeof moof, ParsedBox<MovieFragmentBox>>>(true)
		assert.strictEqual(moof.boxes.length, 2)

		const tfdt = findIsoBox(boxes, box => box.type === 'tfdt')
		assert.ok(tfdt)
		expectType<Equal<typeof tfdt, ParsedBox<TrackFragmentBaseMediaDecodeTimeBox>>>(true)
		assert.strictEqual(tfdt.baseMediaDecodeTime, 0)
	})

	it('should replace one built-in reader in a spread of the default map', async function () {
		const isoFile = await readFile(new URL('./fixtures/test_frag.mp4', import.meta.url))
		// #region spread
		const boxes = readIsoBoxes(new Uint8Array(isoFile), {
			readers: { ...defaultReaderConfig().readers, tfdt: readTfdt64 },
		})
		// #endregion spread

		const [ftyp] = boxes
		assert.ok(ftyp)
		if (ftyp.type === 'ftyp') {
			expectType<Equal<typeof ftyp, ParsedBox<FileTypeBox>>>(true)
		} else {
			assert.fail('expected a ftyp box')
		}

		const moof = findIsoBox(boxes, box => box.type === 'moof')
		assert.ok(moof)
		expectType<Equal<typeof moof, ParsedBox<MovieFragmentBox>>>(true)

		const tfdt = findIsoBox(boxes, box => box.type === 'tfdt')
		assert.ok(tfdt)
		// The custom reader replaces the built-in tfdt type, so the field is a bigint, not `number | bigint`.
		expectType<Equal<typeof tfdt.baseMediaDecodeTime, bigint>>(true)
		expectType<Equal<typeof tfdt.exact, boolean>>(true)
		assert.strictEqual(tfdt.baseMediaDecodeTime, BigInt(0))
		assert.strictEqual(tfdt.exact, true)
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
			expectType<Equal<typeof box.baseMediaDecodeTime, bigint>>(true)
			expectType<Equal<typeof box.exact, boolean>>(true)
			assert.strictEqual(box.baseMediaDecodeTime, BigInt('9007199254740993'))
			assert.strictEqual(box.exact, true)
		} else {
			assert.fail('expected a tfdt box')
		}
	})

	it('should type an optional custom reader without undefined', function () {
		const readers: { tfdt?: typeof readTfdt64 } = {}
		const boxes = readIsoBoxes(TFDT_V0.buffer, { readers })

		// The result has the return type of the reader and the header-only types. It has no `undefined`.
		expectType<
			Equal<(typeof boxes)[number], ParsedBox<ReturnType<typeof readTfdt64>> | HeaderOnlyBox>
		>(true)

		const [box] = boxes
		assert.ok(box)
		if (box.type === 'tfdt') {
			expectType<Equal<typeof box.baseMediaDecodeTime, bigint>>(true)
			// The map has no tfdt reader yet, so the box has only its header fields.
			assert.deepStrictEqual(Object.keys(box).sort(), ['size', 'type', 'view'])
		} else {
			assert.fail('expected a tfdt box')
		}

		readers.tfdt = readTfdt64
		const [exact] = readIsoBoxes(TFDT_V0.buffer, { readers })

		assert.ok(exact)
		if (exact.type === 'tfdt') {
			assert.strictEqual(exact.baseMediaDecodeTime, BigInt(1))
		} else {
			assert.fail('expected a tfdt box')
		}
	})

	it('should keep the built-in box types when the reader map has no literal keys', function () {
		const name: string = 'ftyp'
		// The key is not a literal, so the map may hold a reader for any box.
		const boxes = readIsoBoxes(TFDT_V0.buffer, { readers: { [name]: readFtyp } })

		expectType<Equal<(typeof boxes)[number], ParsedIsoBox>>(true)

		const [box] = boxes
		assert.ok(box)
		if (box.type === 'tfdt') {
			expectType<Equal<typeof box.baseMediaDecodeTime, number>>(true)
		} else {
			assert.fail('expected a tfdt box')
		}
	})

	it('should keep the built-in box types for a map typed IsoBoxReaderMap', function () {
		const readers: IsoBoxReaderMap = { tfdt: readTfdt }
		const boxes = readIsoBoxes(TFDT_V0.buffer, { readers })

		// The readers of the map return `unknown`, so they add nothing to the union.
		expectType<Equal<(typeof boxes)[number], ParsedIsoBox>>(true)

		const [box] = boxes
		assert.ok(box)
		if (box.type === 'tfdt') {
			expectType<Equal<typeof box.baseMediaDecodeTime, number>>(true)
			assert.strictEqual(box.baseMediaDecodeTime, 1)
		} else {
			assert.fail('expected a tfdt box')
		}
	})

	it('should narrow a url key through the return type of its reader', function () {
		// A 'url ' box with the self-contained flag set and no location.
		const bytes = new Uint8Array([
			0x00, 0x00, 0x00, 0x0c, 0x75, 0x72, 0x6c, 0x20, 0x00, 0x00, 0x00, 0x01,
		])
		const readUrlCustom = (view: IsoBoxReadView) => ({
			...readUrl(view),
			custom: true,
		})

		// The view also finds a reader by the trimmed type, so the url key reads the 'url ' box.
		const [box] = readIsoBoxes(bytes.buffer, { readers: { url: readUrlCustom } })

		assert.ok(box)
		if (box.type === 'url ') {
			expectType<Equal<typeof box.custom, boolean>>(true)
			expectType<Equal<typeof box.location, string>>(true)
			assert.strictEqual(box.custom, true)
		} else {
			assert.fail('expected a url box')
		}
	})

	it('should type every box as header-only without a reader map', async function () {
		const isoFile = await readFile(new URL('./fixtures/test_frag.mp4', import.meta.url))
		const boxes = readIsoBoxes(new Uint8Array(isoFile))

		expectType<Equal<(typeof boxes)[number], HeaderOnlyBox>>(true)

		const [ftyp, moov] = boxes
		assert.ok(ftyp)
		assert.ok(moov)

		// @ts-expect-error No reader parses ftyp, so the union has no ftyp type.
		if (ftyp.type === 'ftyp') {
			// The header still names the type. The box has no parsed fields.
			assert.deepStrictEqual(Object.keys(ftyp).sort(), ['size', 'type', 'view'])
		} else {
			assert.fail('expected a ftyp box')
		}

		if (moov.type === 'moov') {
			assert.strictEqual(moov.boxes.length, 4)
		} else {
			assert.fail('expected a moov box')
		}
	})
})
