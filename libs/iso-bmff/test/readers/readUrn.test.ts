import { assert, describe, it, readIsoBoxes, readUrn } from '../util/box.ts'

const TEXT_BYTES = [0xc3, 0xa9, 0xe6, 0x97, 0xa5, 0xf0, 0x9f, 0x98, 0x80] // 'é日😀'
const A_MP4 = [97, 46, 109, 112, 52] // 'a.mp4'
const URN_A = [117, 114, 110, 58, 97] // 'urn:a'

// The bytes of a urn box: size, type (urn ), version, flags, then the bytes of the two string fields.
function urnBox(strings: number[]): Uint8Array {
	return new Uint8Array([0, 0, 0, 12 + strings.length, 117, 114, 110, 32, 0, 0, 0, 0, ...strings])
}

describe('readUrn', function () {
	it('should read an ASCII location after a name with multi-byte UTF-8 characters', function () {
		// #region example
		// A urn box with the UTF-8 bytes of the name 'é日😀' and the location 'a.mp4'.
		const bytes = new Uint8Array([
			0, 0, 0, 28, 117, 114, 110, 32, 0, 0, 0, 0, 0xc3, 0xa9, 0xe6, 0x97, 0xa5, 0xf0, 0x9f, 0x98,
			0x80, 0, 97, 46, 109, 112, 52, 0,
		])
		const [urn] = readIsoBoxes(bytes, { readers: { 'urn ': readUrn } })
		// #endregion example

		assert.ok(urn)
		assert.strictEqual(urn.type, 'urn ')
		assert.strictEqual(urn.version, 0)
		assert.strictEqual(urn.flags, 0)
		assert.strictEqual(urn.name, 'é日😀')
		assert.strictEqual(urn.location, 'a.mp4')
	})

	it('should read a name and a location with multi-byte UTF-8 characters', function () {
		const [urn] = readIsoBoxes(urnBox([...TEXT_BYTES, 0, ...TEXT_BYTES, 0]), {
			readers: { 'urn ': readUrn },
		})

		assert.ok(urn)
		assert.strictEqual(urn.type, 'urn ')
		assert.strictEqual(urn.name, 'é日😀')
		assert.strictEqual(urn.location, 'é日😀')
	})

	it('should read an ASCII name and an ASCII location', function () {
		const [urn] = readIsoBoxes(urnBox([...URN_A, 0, ...A_MP4, 0]), {
			readers: { 'urn ': readUrn },
		})

		assert.ok(urn)
		assert.strictEqual(urn.type, 'urn ')
		assert.strictEqual(urn.name, 'urn:a')
		assert.strictEqual(urn.location, 'a.mp4')
	})

	it('should read an empty name and an empty location', function () {
		const [urn] = readIsoBoxes(urnBox([0, 0]), { readers: { 'urn ': readUrn } })

		assert.ok(urn)
		assert.strictEqual(urn.type, 'urn ')
		assert.strictEqual(urn.name, '')
		assert.strictEqual(urn.location, '')
	})

	it('should read a location after an empty name', function () {
		const [urn] = readIsoBoxes(urnBox([0, ...A_MP4, 0]), { readers: { 'urn ': readUrn } })

		assert.ok(urn)
		assert.strictEqual(urn.type, 'urn ')
		assert.strictEqual(urn.name, '')
		assert.strictEqual(urn.location, 'a.mp4')
	})
})
