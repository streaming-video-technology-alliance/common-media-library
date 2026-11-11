import {
	assert,
	describe,
	filterBoxes,
	it,
	readDref,
	readIsoBoxes,
	readUrl,
	writeUrl,
	type DataEntryUrlBox,
	type ParsedBox,
} from '../util/box.ts'

// 'é日😀' has one character of two, three, and four UTF-8 bytes.
const TEXT = 'é日😀'
const TEXT_BYTES = [0xc3, 0xa9, 0xe6, 0x97, 0xa5, 0xf0, 0x9f, 0x98, 0x80]

describe('writeUrl', function () {
	it('should write no location string when flag 0x000001 is set', function () {
		// #region example
		const writer = writeUrl({ type: 'url ', version: 0, flags: 1, location: '' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0,
				0,
				0,
				12, // size (8 + 4 = 12)
				117,
				114,
				108,
				32, // type (url )
				0, // version
				0,
				0,
				1, // flags
			]),
		)
		// #endregion example
	})

	it('should write the location string when flag 0x000001 is not set', function () {
		const writer = writeUrl({ type: 'url ', version: 0, flags: 0, location: 'a.mp4' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0,
				0,
				0,
				18, // size (8 + 4 + 6 = 18)
				117,
				114,
				108,
				32, // type (url )
				0, // version
				0,
				0,
				0, // flags
				97,
				46,
				109,
				112,
				52,
				0, // location (a.mp4) and the null terminator
			]),
		)
	})

	it('should write the null terminator of an empty location when flag 0x000001 is not set', function () {
		const writer = writeUrl({ type: 'url ', version: 0, flags: 0, location: '' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 13, 117, 114, 108, 32, 0, 0, 0, 0, 0]),
		)
	})

	it('should omit a location that is not empty when flag 0x000001 is set', function () {
		const writer = writeUrl({ type: 'url ', version: 0, flags: 1, location: 'a.mp4' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 12, 117, 114, 108, 32, 0, 0, 0, 1]),
		)
	})

	it('should write no location string when flag 0x000001 is set with another flag', function () {
		const writer = writeUrl({ type: 'url ', version: 0, flags: 3, location: 'a' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 12, 117, 114, 108, 32, 0, 0, 0, 3]),
		)
	})

	it('should write the location string when only another flag is set', function () {
		const writer = writeUrl({ type: 'url ', version: 0, flags: 2, location: 'a' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 14, 117, 114, 108, 32, 0, 0, 0, 2, 97, 0]),
		)
	})

	it('should write the UTF-8 bytes of a location that is not ASCII', function () {
		const writer = writeUrl({ type: 'url ', version: 0, flags: 0, location: TEXT })

		// size: 12 + 9 location bytes + 1 null terminator = 22
		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 22, 117, 114, 108, 32, 0, 0, 0, 0, ...TEXT_BYTES, 0]),
		)
	})

	for (const text of ['a.mp4', '', TEXT]) {
		it(`should write a box that readUrl reads with the location '${text}'`, function () {
			const box: DataEntryUrlBox = { type: 'url ', version: 0, flags: 0, location: text }
			const [parsed] = readIsoBoxes(new Uint8Array(writeUrl(box).buffer), {
				readers: { 'url ': readUrl },
			})

			assert.ok(parsed)
			assert.strictEqual(parsed.type, 'url ')

			const { type, version, flags, location } = parsed

			assert.deepStrictEqual({ type, version, flags, location }, box)
		})
	}

	it('should write the bytes of a parsed box that has flag 0x000001', function () {
		const [dref] = filterBoxes('captions.mp4', 'dref', {
			readers: { dref: readDref, 'url ': readUrl },
		})
		const [entry] = dref.entries

		assert.strictEqual(entry.type, 'url ')
		assert.strictEqual(entry.flags, 1)

		const { view } = entry as ParsedBox<DataEntryUrlBox>
		const input = new Uint8Array(view.buffer, view.byteOffset, view.byteLength)

		assert.deepStrictEqual(new Uint8Array(writeUrl(entry).buffer), input)
	})
})
