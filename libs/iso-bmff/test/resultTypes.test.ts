import { expectType, type Equal } from './util/expectType.ts'
import { load } from './util/load.ts'
import {
	assert,
	createIsoBoxReadCursor,
	createIsoBoxWriteCursor,
	describe,
	findIsoBox,
	isContainer,
	isIsoBoxType,
	it,
	readIsoBoxes,
	readMeta,
	readMfhd,
	readStsd,
	readTref,
	readUint32,
	writeIsoBoxes,
	writeMfhd,
	type AudioSampleEntry,
	type IsoBoxMap,
	type IsoBoxReadCursor,
	type IsoBoxReaderMap,
	type IsoBoxWriterMap,
	type IsoRawBox,
	type MetaBox,
	type MovieBox,
	type ParsedIsoBox,
	type TrackReferenceBox,
} from './util/box.ts'

describe('result types', function () {
	it('should reject a test for a box type outside IsoBoxMap on a child of a container', function () {
		const moov: MovieBox = { type: 'moov', boxes: [] }
		const child = moov.boxes[0]

		expectType<Equal<MovieBox['boxes'][number], ParsedIsoBox>>(true)
		assert.strictEqual(child?.type === 'trak', false)
		// @ts-expect-error `hvcC` is not a box type of `IsoBoxMap`.
		assert.strictEqual(child?.type === 'hvcC', false)
	})

	it('should give the child boxes the mode of the 64-bit fields', function () {
		expectType<Equal<IsoBoxMap<bigint>['dinf']['boxes'][number], ParsedIsoBox<bigint>>>(true)
		expectType<Equal<IsoBoxMap<bigint>['avc1']['boxes'][number], ParsedIsoBox<bigint>>>(true)
		expectType<Equal<IsoBoxMap<bigint>['moov']['boxes'][number], ParsedIsoBox<bigint>>>(true)
		expectType<Equal<IsoBoxMap['tref']['boxes'][number], ParsedIsoBox>>(true)
	})

	it('should reject a type argument of readStsd', function () {
		const cursor = undefined as unknown as Parameters<typeof readStsd>[0]

		// @ts-expect-error readStsd has no type parameter.
		assert.ok(() => readStsd<AudioSampleEntry>(cursor))
	})

	it('should narrow a box with a boxes field with isContainer', function () {
		const boxes = readIsoBoxes(load('captions.mp4'), { readers: { meta: readMeta } })
		const box = boxes[0]

		if (box && isContainer(box) && box.type === 'meta') {
			expectType<Equal<typeof box, MetaBox>>(true)
		}

		assert.ok(boxes.length > 0)
	})

	it('should reject a reader result with a type that is not a literal', function () {
		const boxes = readIsoBoxes(new Uint8Array(0), {
			// @ts-expect-error The reader of `abcd` returns a box with the type `abcd`.
			readers: { abcd: () => ({ type: 'abcd' as string, x: 1 }) },
		})

		assert.strictEqual(boxes.length, 0)
	})

	it('should read a child of tref as a raw box', function () {
		const tref = new Uint8Array([
			0, 0, 0, 20, 0x74, 0x72, 0x65, 0x66, 0, 0, 0, 12, 0x68, 0x69, 0x6e, 0x74, 0, 0, 0, 1,
		])
		const [box] = readIsoBoxes(tref, { readers: { tref: readTref } })

		assert.ok(isIsoBoxType('tref', box))

		const child: TrackReferenceBox['boxes'][number] | undefined = box.boxes[0]

		assert.ok(child && 'bytes' in child)
		expectType<Equal<Extract<typeof child, { bytes: Uint8Array }>, IsoRawBox>>(true)
		assert.ok(findIsoBox(box.boxes, b => !b.type && b.boxType === 'hint'))
	})

	it('should remove the default type argument of Box and the child types', function () {
		// @ts-expect-error Box has no default type argument.
		type NoArgument = import('@svta/cml-iso-bmff').Box
		// @ts-expect-error The child types are removed.
		type Child = import('@svta/cml-iso-bmff').MovieBoxChild
		// @ts-expect-error TrackReferenceTypeBox is removed.
		type Reference = import('@svta/cml-iso-bmff').TrackReferenceTypeBox

		expectType<[NoArgument, Child, Reference] | null>(null)
	})

	it('should reject a reader or a writer under the key of another box type', function () {
		// @ts-expect-error readMfhd does not return a tfdt box.
		const readers: IsoBoxReaderMap = { tfdt: readMfhd }
		// @ts-expect-error writeMfhd does not take a tfdt box.
		const writers: IsoBoxWriterMap = { tfdt: writeMfhd }

		// @ts-expect-error readMfhd does not return a tfdt box.
		readIsoBoxes(new Uint8Array(0), { readers: { tfdt: readMfhd } })
		// @ts-expect-error writeMfhd does not take a tfdt box.
		writeIsoBoxes([], { writers: { tfdt: writeMfhd } })

		assert.deepStrictEqual([Object.keys(readers), Object.keys(writers)], [['tfdt'], ['tfdt']])
	})

	it('should reject a custom reader with no type field in its result', function () {
		const noType = (cursor: IsoBoxReadCursor) => ({ value: readUint32(cursor) })

		// @ts-expect-error The result of a reader has a type field.
		const readers: IsoBoxReaderMap = { abcd: noType }

		// @ts-expect-error The result of a reader has a type field.
		readIsoBoxes(new Uint8Array(0), { readers: { abcd: noType } })

		assert.deepStrictEqual(Object.keys(readers), ['abcd'])
	})

	it('should not allow a change of a cursor field other than pos', function () {
		const cursor = createIsoBoxReadCursor(new Uint8Array(8))
		const output = createIsoBoxWriteCursor()

		cursor.pos = 4
		output.pos = 4

		// @ts-expect-error view is readonly.
		cursor.view = new DataView(new ArrayBuffer(8))
		// @ts-expect-error start is readonly.
		cursor.start = 0
		// @ts-expect-error end is readonly.
		cursor.end = 8
		// @ts-expect-error readers is readonly.
		cursor.readers = undefined
		// @ts-expect-error int64 is readonly.
		cursor.int64 = undefined
		// @ts-expect-error view is readonly.
		output.view = new DataView(new ArrayBuffer(8))
		// @ts-expect-error bytes is readonly.
		output.bytes = new Uint8Array(8)
		// @ts-expect-error writers is readonly.
		output.writers = undefined

		assert.deepStrictEqual([cursor.pos, output.pos], [4, 4])
	})
})
