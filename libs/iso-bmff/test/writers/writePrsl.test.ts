import { writeWith } from '../util/writeWith.ts'
import {
	isIsoBoxType,
	assert,
	createDefaultReaderConfig,
	createDefaultWriterConfig,
	describe,
	filterBoxes,
	it,
	readIsoBoxes,
	writeIsoBox,
	writePrsl,
	type ExtendedLanguageBox,
	type PreselectionGroupBox,
} from '../util/box.ts'
import { record, sourceOf } from '../util/sources.ts'

describe('writePrsl', function () {
	it('should write the null terminator of an empty interleavingTag when flag 0x4000 is set', function () {
		// #region example
		const box: PreselectionGroupBox = {
			type: 'prsl',
			version: 0,
			flags: 0x4000,
			groupId: 1,
			entityId: [2],
			interleavingTag: '',
			boxes: [],
		}

		const writer = writeIsoBox(box, { writers: { prsl: writePrsl } })
		// #endregion example

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0,
				0,
				0,
				25, // size (8 + 4 + 4 + 4 + 4 + 1 = 25)
				112,
				114,
				115,
				108, // type (prsl)
				0, // version
				0,
				64,
				0, // flags
				0,
				0,
				0,
				1, // groupId
				0,
				0,
				0,
				1, // numEntitiesInGroup
				0,
				0,
				0,
				2, // entityId[0]
				0, // interleavingTag (empty) and the null terminator
			]),
		)
	})

	it('should write the null terminator of an empty preselectionTag when flag 0x1000 is set', function () {
		const writer = writeWith(
			writePrsl,
			{
				type: 'prsl',
				version: 0,
				flags: 0x1000,
				groupId: 1,
				entityId: [],
				preselectionTag: '',
				boxes: [],
			},
			{ writers: {} },
		)

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 21, 112, 114, 115, 108, 0, 0, 16, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0]),
		)
	})

	for (const [flags, tag] of [
		[0x1000, 'preselectionTag'],
		[0x4000, 'interleavingTag'],
	] as const) {
		it(`should throw a RangeError when the flags name ${tag} and the box has no value`, function () {
			assert.throws(
				() =>
					writeWith(
						writePrsl,
						{ type: 'prsl', version: 0, flags, groupId: 1, entityId: [], boxes: [] },
						{ writers: {} },
					),
				/^RangeError: .*writeTerminatedUtf8.* received undefined$/,
			)
		})
	}

	it('should write an empty tag before a tag that is not empty', function () {
		const writer = writeWith(
			writePrsl,
			{
				type: 'prsl',
				version: 0,
				flags: 0x5000,
				groupId: 1,
				entityId: [],
				preselectionTag: '',
				interleavingTag: 'b',
				boxes: [],
			},
			{ writers: {} },
		)

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 23, 112, 114, 115, 108, 0, 0, 80, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 98, 0,
			]),
		)
	})

	it('should throw a RangeError when the flags name selectionPriority and the box has no value', function () {
		assert.throws(
			() =>
				writeWith(
					writePrsl,
					{ type: 'prsl', version: 0, flags: 0x2000, groupId: 1, entityId: [], boxes: [] },
					{ writers: {} },
				),
			/^RangeError: .*writeUint8.* received undefined$/,
		)
	})

	it('should write a tag as UTF-8 bytes', function () {
		const writer = writeWith(
			writePrsl,
			{
				type: 'prsl',
				version: 0,
				flags: 0x1000,
				groupId: 1,
				entityId: [],
				preselectionTag: 'é',
				boxes: [],
			},
			{ writers: {} },
		)

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 23, 112, 114, 115, 108, 0, 0, 16, 0, 0, 0, 0, 1, 0, 0, 0, 0, 195, 169, 0,
			]),
		)
	})

	it('should write the tags and the selection priority that the flags declare', function () {
		const writer = writeWith(
			writePrsl,
			{
				type: 'prsl',
				version: 0,
				flags: 0x7000,
				groupId: 1,
				entityId: [],
				preselectionTag: 'a',
				selectionPriority: 3,
				interleavingTag: 'b',
				boxes: [],
			},
			{ writers: {} },
		)

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 25, 112, 114, 115, 108, 0, 0, 112, 0, 0, 0, 0, 1, 0, 0, 0, 0, 97, 0, 3, 98, 0,
			]),
		)
	})

	it('should not write a tag when the flag of the tag is not set', function () {
		const writer = writeWith(
			writePrsl,
			{
				type: 'prsl',
				version: 0,
				flags: 0,
				groupId: 1,
				entityId: [],
				preselectionTag: 'a',
				interleavingTag: 'b',
				boxes: [],
			},
			{ writers: {} },
		)

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 20, 112, 114, 115, 108, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0]),
		)
	})

	for (const [flag, tag] of [
		[0x1000, 'preselectionTag'],
		[0x4000, 'interleavingTag'],
	] as const) {
		it(`should keep the child boxes after a write and a read when ${tag} is empty`, function () {
			const bytes = writeIsoBox(
				{
					type: 'prsl',
					version: 0,
					flags: flag,
					groupId: 1,
					entityId: [],
					[tag]: '',
					boxes: [{ type: 'elng', version: 0, flags: 0, extendedLanguage: 'en' }],
				},
				createDefaultWriterConfig(),
			)

			const [prsl] = readIsoBoxes(bytes, record(createDefaultReaderConfig()))

			assert.ok(isIsoBoxType('prsl', prsl))
			assert.strictEqual(prsl[tag], '')
			assert.strictEqual(prsl.boxes.length, 1)

			const [child] = prsl.boxes as ExtendedLanguageBox[]

			assert.ok(isIsoBoxType('elng', child))
			assert.strictEqual(child.extendedLanguage, 'en')
		})
	}

	it('should write the bytes of every parsed prsl box of a file', function () {
		const boxes = filterBoxes('SRMP_AC4.mp4', 'prsl', record(createDefaultReaderConfig()))

		assert.strictEqual(boxes.length, 6)

		for (const box of boxes) {
			const input = sourceOf(box).bytes

			assert.strictEqual(box.interleavingTag, '')
			assert.deepStrictEqual(writeIsoBox(box, createDefaultWriterConfig()), input)
		}
	})

	it('should write the length of entityId as the count', function () {
		const bytes = writeIsoBox(
			{
				type: 'prsl',
				version: 0,
				flags: 0x5000,
				groupId: 1,
				entityId: [7, 8],
				preselectionTag: 'a',
				interleavingTag: 'c',
				boxes: [],
			},
			{ writers: { prsl: writePrsl } },
		)
		const [box] = readIsoBoxes(bytes, createDefaultReaderConfig())

		assert.deepStrictEqual(Array.from(bytes.subarray(16, 20)), [0, 0, 0, 2])
		assert.deepStrictEqual(Array.from(bytes.subarray(28)), [0x61, 0, 0x63, 0])
		assert.ok(isIsoBoxType('prsl', box))
		assert.strictEqual(box.preselectionTag, 'a')
		assert.strictEqual(box.interleavingTag, 'c')
	})

	it('should throw a RangeError for a tag with U+0000', function () {
		assert.throws(
			() =>
				writeIsoBox(
					{
						type: 'prsl',
						version: 0,
						flags: 0x1000,
						groupId: 1,
						entityId: [],
						preselectionTag: 'a\0b',
						boxes: [],
					},
					{ writers: { prsl: writePrsl } },
				),
			(error: unknown) =>
				error instanceof RangeError &&
				error.message.includes('writeTerminatedUtf8') &&
				error.message.endsWith(' received a\0b'),
		)
	})
})
