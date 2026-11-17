import {
	assert,
	describe,
	it,
	readIsoBoxes,
	readUrn,
	writeUrn,
	type DataEntryUrnBox,
} from '../util/box.ts'

// 'é日😀' has one character of two, three, and four UTF-8 bytes.
const TEXT = 'é日😀'
const TEXT_BYTES = [0xc3, 0xa9, 0xe6, 0x97, 0xa5, 0xf0, 0x9f, 0x98, 0x80]

const URN_PREFIX = [117, 114, 110, 58] // 'urn:'
const A_MP4 = [97, 46, 109, 112, 52] // 'a.mp4'

// type (urn ), version and flags
const FIELDS = [117, 114, 110, 32, 0, 0, 0, 0]

function urn(name: string, location: string): DataEntryUrnBox {
	return { type: 'urn ', version: 0, flags: 0, name, location }
}

describe('writeUrn', function () {
	it('should write the name and the location, each with a null terminator', function () {
		// #region example
		const writer = writeUrn({
			type: 'urn ',
			version: 0,
			flags: 0,
			name: 'urn:a',
			location: 'a.mp4',
		})

		// size (24), type (urn ), version and flags, then the name (urn:a) and
		// the location (a.mp4), each with a null terminator
		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 24, 117, 114, 110, 32, 0, 0, 0, 0, 117, 114, 110, 58, 97, 0, 97, 46, 109, 112, 52,
				0,
			]),
		)
		// #endregion example
	})

	it('should write the UTF-8 bytes of a name that is not ASCII before an ASCII location', function () {
		const writer = writeUrn(urn(`urn:${TEXT}`, 'a.mp4'))

		// size: 12 + 13 name bytes + 1 + 5 location bytes + 1 = 32
		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 32, ...FIELDS, ...URN_PREFIX, ...TEXT_BYTES, 0, ...A_MP4, 0]),
		)
	})

	it('should write the UTF-8 bytes of a name and a location that are not ASCII', function () {
		const writer = writeUrn(urn(TEXT, TEXT))

		// size: 12 + 9 name bytes + 1 + 9 location bytes + 1 = 32
		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 32, ...FIELDS, ...TEXT_BYTES, 0, ...TEXT_BYTES, 0]),
		)
	})

	it('should write the null terminator of each empty string', function () {
		const writer = writeUrn(urn('', ''))

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 14, ...FIELDS, 0, 0]),
		)
	})

	const strings: [name: string, location: string][] = [
		['urn:a', 'a.mp4'],
		['', ''],
		[`urn:${TEXT}`, 'a.mp4'],
		[TEXT, TEXT],
	]

	for (const [name, location] of strings) {
		it(`should write a box that readUrn reads with the name '${name}' and the location '${location}'`, function () {
			const box = urn(name, location)
			const [parsed] = readIsoBoxes(new Uint8Array(writeUrn(box).buffer), {
				readers: { 'urn ': readUrn },
			})

			assert.ok(parsed)
			assert.strictEqual(parsed.type, 'urn ')

			const { type, version, flags } = parsed

			assert.deepStrictEqual(
				{ type, version, flags, name: parsed.name, location: parsed.location },
				box,
			)
		})
	}
})
