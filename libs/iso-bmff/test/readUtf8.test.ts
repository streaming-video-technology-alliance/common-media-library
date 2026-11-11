import {
	assert,
	describe,
	it,
	IsoBoxReadView,
	readElng,
	readIsoBoxes,
	readKind,
	readLabl,
	readPrsl,
	writeElng,
	writeIsoBox,
	writeKind,
	writeLabl,
	writePrsl,
	type ExtendedLanguageBox,
} from './util/box.ts'

const NIHON = [0xe6, 0x97, 0xa5, 0xe6, 0x9c, 0xac] // '日本'
const MAIN = [0x6d, 0x61, 0x69, 0x6e] // 'main'

// The UTF-8 bytes of each string, without the null byte.
const CASES: [name: string, text: string, bytes: number[]][] = [
	['an ASCII string', 'main', MAIN],
	['an empty string', '', []],
	['a string with a two-byte character', 'urn:é', [0x75, 0x72, 0x6e, 0x3a, 0xc3, 0xa9]],
	['a string with three-byte characters', '日本', NIHON],
	['a string with a four-byte character', '😀', [0xf0, 0x9f, 0x98, 0x80]],
]

describe('IsoBoxReadView.readUtf8', function () {
	it('should read two null-terminated strings in a row', function () {
		// #region example
		// Two null-terminated UTF-8 strings: '日本' has six bytes, 'main' has four bytes.
		const bytes = new Uint8Array([
			0xe6, 0x97, 0xa5, 0xe6, 0x9c, 0xac, 0x00, 0x6d, 0x61, 0x69, 0x6e, 0x00,
		])
		const view = new IsoBoxReadView(bytes)

		const language = view.readUtf8(-1) // '日本', the view moves seven bytes
		const label = view.readUtf8(-1) // 'main', the view moves five bytes
		// #endregion example

		assert.strictEqual(language, '日本')
		assert.strictEqual(label, 'main')
		assert.strictEqual(view.cursor, 12)
		assert.strictEqual(view.bytesRemaining, 0)
	})

	for (const [name, text, bytes] of CASES) {
		it(`should move to the byte after the null byte of ${name}`, function () {
			const view = new IsoBoxReadView(new Uint8Array([...bytes, 0x00, 0x2a]))

			assert.strictEqual(view.readUtf8(-1), text)
			assert.strictEqual(view.cursor, bytes.length + 1)
			assert.strictEqual(view.readUint(1), 0x2a)
			assert.strictEqual(view.done, true)
		})
	}

	it('should read from a view that starts inside a buffer', function () {
		const buffer = new Uint8Array([0xff, 0xff, ...NIHON, 0x00, 0x2a, 0xff])
		const view = new IsoBoxReadView(buffer.subarray(2, 10))

		assert.strictEqual(view.readUtf8(-1), '日本')
		assert.strictEqual(view.cursor, 7)
		assert.strictEqual(view.readUint(1), 0x2a)
		assert.strictEqual(view.done, true)
	})

	it('should read to the end of the view when the string has no null byte', function () {
		const view = new IsoBoxReadView(new Uint8Array([...NIHON, ...MAIN]))

		assert.strictEqual(view.readUtf8(-1), '日本main')
		assert.strictEqual(view.done, true)
	})

	it('should not read past the end of a view that ends inside a buffer', function () {
		const buffer = new Uint8Array([...NIHON, ...MAIN, 0x00])
		const view = new IsoBoxReadView(buffer.subarray(0, 6))

		assert.strictEqual(view.readUtf8(-1), '日本')
		assert.strictEqual(view.done, true)
	})

	for (const schemeUri of ['urn:é', 'urn:日本']) {
		it(`should read the value of a kind box after the schemeUri ${schemeUri}`, function () {
			const bytes = writeIsoBox(
				{ type: 'kind', version: 0, flags: 0, schemeUri, value: 'main' },
				{ writers: { kind: writeKind } },
			)
			const [kind] = readIsoBoxes(bytes, { readers: { kind: readKind } })

			assert.ok(kind)
			assert.strictEqual(kind.type, 'kind')
			assert.strictEqual(kind.schemeUri, schemeUri)
			assert.strictEqual(kind.value, 'main')
		})
	}

	it('should read the label of a labl box after a language with multi-byte characters', function () {
		const bytes = writeIsoBox(
			{
				type: 'labl',
				version: 0,
				flags: 0,
				isGroupLabel: false,
				labelId: 7,
				language: '日本',
				label: 'main',
			},
			{ writers: { labl: writeLabl } },
		)
		const [labl] = readIsoBoxes(bytes, { readers: { labl: readLabl } })

		assert.ok(labl)
		assert.strictEqual(labl.type, 'labl')
		assert.strictEqual(labl.labelId, 7)
		assert.strictEqual(labl.language, '日本')
		assert.strictEqual(labl.label, 'main')
	})

	it('should read the child boxes of a prsl box after a preselectionTag with multi-byte characters', function () {
		const elng: ExtendedLanguageBox = {
			type: 'elng',
			version: 0,
			flags: 0,
			extendedLanguage: 'ja',
		}
		const bytes = writeIsoBox(
			{
				type: 'prsl',
				version: 0,
				flags: 0x1000,
				groupId: 1,
				numEntitiesInGroup: 1,
				entities: [{ entityId: 1 }],
				preselectionTag: '日本',
				boxes: [elng],
			},
			{ writers: { prsl: writePrsl, elng: writeElng } },
		)
		const [prsl] = readIsoBoxes(bytes, { readers: { prsl: readPrsl, elng: readElng } })

		assert.ok(prsl)
		assert.strictEqual(prsl.type, 'prsl')
		assert.strictEqual(prsl.preselectionTag, '日本')

		const boxes = prsl.boxes as ExtendedLanguageBox[]

		assert.strictEqual(boxes.length, 1)
		assert.strictEqual(boxes[0].type, 'elng')
		assert.strictEqual(boxes[0].extendedLanguage, 'ja')
	})

	it('should read every field of a prsl box after two tags with multi-byte characters', function () {
		const elng: ExtendedLanguageBox = {
			type: 'elng',
			version: 0,
			flags: 0,
			extendedLanguage: 'ja',
		}
		const bytes = writeIsoBox(
			{
				type: 'prsl',
				version: 0,
				flags: 0x7000,
				groupId: 1,
				numEntitiesInGroup: 1,
				entities: [{ entityId: 1 }],
				preselectionTag: '日本',
				selectionPriority: 5,
				interleavingTag: 'é',
				boxes: [elng],
			},
			{ writers: { prsl: writePrsl, elng: writeElng } },
		)
		const [prsl] = readIsoBoxes(bytes, { readers: { prsl: readPrsl, elng: readElng } })

		assert.ok(prsl)
		assert.strictEqual(prsl.type, 'prsl')
		assert.strictEqual(prsl.preselectionTag, '日本')
		assert.strictEqual(prsl.selectionPriority, 5)
		assert.strictEqual(prsl.interleavingTag, 'é')

		const boxes = prsl.boxes as ExtendedLanguageBox[]

		assert.strictEqual(boxes.length, 1)
		assert.strictEqual(boxes[0].type, 'elng')
		assert.strictEqual(boxes[0].extendedLanguage, 'ja')
	})
})
