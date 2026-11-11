import {
	assert,
	defaultReaderConfig,
	defaultWriterConfig,
	describe,
	filterBoxes,
	it,
	readIsoBoxes,
	writeIsoBox,
	writePrsl,
	type ExtendedLanguageBox,
	type PreselectionGroupBox,
} from '../util/box.ts'

describe('writePrsl', function () {
	it('should write the null terminator of an empty interleavingTag when flag 0x4000 is set', function () {
		// #region example
		const box: PreselectionGroupBox = {
			type: 'prsl',
			version: 0,
			flags: 0x4000,
			groupId: 1,
			numEntitiesInGroup: 1,
			entities: [{ entityId: 2 }],
			interleavingTag: '',
			boxes: [],
		}

		const writer = writePrsl(box, { writers: {} })

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
				2, // entities[0].entityId
				0, // interleavingTag (empty) and the null terminator
			]),
		)
		// #endregion example
	})

	it('should write the null terminator of an empty preselectionTag when flag 0x1000 is set', function () {
		const writer = writePrsl(
			{
				type: 'prsl',
				version: 0,
				flags: 0x1000,
				groupId: 1,
				numEntitiesInGroup: 0,
				entities: [],
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

	it('should write an empty tag for each flag when the box has no tag values', function () {
		const writer = writePrsl(
			{
				type: 'prsl',
				version: 0,
				flags: 0x5000,
				groupId: 1,
				numEntitiesInGroup: 0,
				entities: [],
				boxes: [],
			},
			{ writers: {} },
		)

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 22, 112, 114, 115, 108, 0, 0, 80, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0]),
		)
	})

	it('should write an empty tag before a tag that is not empty', function () {
		const writer = writePrsl(
			{
				type: 'prsl',
				version: 0,
				flags: 0x5000,
				groupId: 1,
				numEntitiesInGroup: 0,
				entities: [],
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

	it('should write a selection priority of 0 when flag 0x2000 is set and the box has no value', function () {
		const writer = writePrsl(
			{
				type: 'prsl',
				version: 0,
				flags: 0x2000,
				groupId: 1,
				numEntitiesInGroup: 0,
				entities: [],
				boxes: [],
			},
			{ writers: {} },
		)

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 21, 112, 114, 115, 108, 0, 0, 32, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0]),
		)
	})

	it('should write a tag as UTF-8 bytes', function () {
		const writer = writePrsl(
			{
				type: 'prsl',
				version: 0,
				flags: 0x1000,
				groupId: 1,
				numEntitiesInGroup: 0,
				entities: [],
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
		const writer = writePrsl(
			{
				type: 'prsl',
				version: 0,
				flags: 0x7000,
				groupId: 1,
				numEntitiesInGroup: 0,
				entities: [],
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
		const writer = writePrsl(
			{
				type: 'prsl',
				version: 0,
				flags: 0,
				groupId: 1,
				numEntitiesInGroup: 0,
				entities: [],
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
					numEntitiesInGroup: 0,
					entities: [],
					[tag]: '',
					boxes: [{ type: 'elng', version: 0, flags: 0, extendedLanguage: 'en' }],
				},
				defaultWriterConfig(),
			)

			const [prsl] = readIsoBoxes(bytes, defaultReaderConfig())

			assert.strictEqual(prsl.type, 'prsl')
			assert.strictEqual(prsl[tag], '')
			assert.strictEqual(prsl.boxes.length, 1)

			const [child] = prsl.boxes as ExtendedLanguageBox[]

			assert.strictEqual(child.type, 'elng')
			assert.strictEqual(child.extendedLanguage, 'en')
		})
	}

	it('should write the bytes of every parsed prsl box of a file', function () {
		const boxes = filterBoxes('SRMP_AC4.mp4', 'prsl', defaultReaderConfig())

		assert.strictEqual(boxes.length, 6)

		for (const box of boxes) {
			const { view } = box
			const input = new Uint8Array(view.buffer, view.byteOffset, view.byteLength)

			assert.strictEqual(box.interleavingTag, '')
			assert.deepStrictEqual(writeIsoBox(box, defaultWriterConfig()), input)
		}
	})
})
