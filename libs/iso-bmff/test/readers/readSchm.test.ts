import { assert, describe, it, readIsoBoxes, readSchm } from '../util/box.ts'

const TYPE = [115, 99, 104, 109] // 'schm'
const SCHEME = [99, 101, 110, 99, 0, 1, 0, 0] // scheme_type (cenc) and scheme_version (0x00010000)

// The bytes of a schm box: size, type, version, flags, scheme_type, scheme_version,
// then the bytes of the scheme_uri field.
function schmBox(flags: number, schemeUri: number[]): Uint8Array {
	const size = 20 + schemeUri.length

	return new Uint8Array([0, 0, 0, size, ...TYPE, 0, 0, 0, flags, ...SCHEME, ...schemeUri])
}

describe('readSchm', function () {
	it('should read a schemeUri with multi-byte UTF-8 characters', function () {
		// #region example
		// A schm box with flag 0x000001 and the UTF-8 bytes of the scheme_uri 'é日😀'.
		const bytes = new Uint8Array([
			0, 0, 0, 30, 115, 99, 104, 109, 0, 0, 0, 1, 99, 101, 110, 99, 0, 1, 0, 0, 0xc3, 0xa9, 0xe6,
			0x97, 0xa5, 0xf0, 0x9f, 0x98, 0x80, 0,
		])
		const [schm] = readIsoBoxes(bytes, { readers: { schm: readSchm } })
		// #endregion example

		assert.ok(schm)
		assert.strictEqual(schm.type, 'schm')
		assert.strictEqual(schm.version, 0)
		assert.strictEqual(schm.flags, 1)
		assert.strictEqual(schm.schemeType, 0x63656e63)
		assert.strictEqual(schm.schemeVersion, 0x00010000)
		assert.strictEqual(schm.schemeUri, 'é日😀')
	})

	it('should read an ASCII schemeUri', function () {
		const [schm] = readIsoBoxes(schmBox(1, [117, 114, 110, 58, 97, 0]), {
			readers: { schm: readSchm },
		})

		assert.ok(schm)
		assert.strictEqual(schm.type, 'schm')
		assert.strictEqual(schm.schemeUri, 'urn:a')
	})

	it('should read an empty schemeUri', function () {
		const [schm] = readIsoBoxes(schmBox(1, [0]), { readers: { schm: readSchm } })

		assert.ok(schm)
		assert.strictEqual(schm.type, 'schm')
		assert.strictEqual(schm.schemeUri, '')
	})

	it('should read no schemeUri when flag 0x000001 is not set', function () {
		const [schm] = readIsoBoxes(schmBox(0, []), { readers: { schm: readSchm } })

		assert.ok(schm)
		assert.strictEqual(schm.type, 'schm')
		assert.strictEqual(schm.schemeType, 0x63656e63)
		assert.strictEqual(schm.schemeVersion, 0x00010000)
		assert.strictEqual(schm.schemeUri, undefined)
	})
})
