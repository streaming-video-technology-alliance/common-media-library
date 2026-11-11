import { assert, describe, it, readIsoBoxes, readUrl } from '../util/box.ts'

const TYPE = [117, 114, 108, 32] // 'url '

// The bytes of a url box: size, type, version, flags, then the bytes of the location field.
function urlBox(flags: number, location: number[]): Uint8Array {
	return new Uint8Array([0, 0, 0, 12 + location.length, ...TYPE, 0, 0, 0, flags, ...location])
}

describe('readUrl', function () {
	it('should read a location with multi-byte UTF-8 characters', function () {
		// #region example
		// A url box with flags 0 and the UTF-8 bytes of the location 'é日😀'.
		const bytes = new Uint8Array([
			0, 0, 0, 22, 117, 114, 108, 32, 0, 0, 0, 0, 0xc3, 0xa9, 0xe6, 0x97, 0xa5, 0xf0, 0x9f, 0x98,
			0x80, 0,
		])
		const [url] = readIsoBoxes(bytes, { readers: { 'url ': readUrl } })
		// #endregion example

		assert.ok(url)
		assert.strictEqual(url.type, 'url ')
		assert.strictEqual(url.version, 0)
		assert.strictEqual(url.flags, 0)
		assert.strictEqual(url.location, 'é日😀')
	})

	it('should read an ASCII location', function () {
		const [url] = readIsoBoxes(urlBox(0, [97, 46, 109, 112, 52, 0]), {
			readers: { 'url ': readUrl },
		})

		assert.ok(url)
		assert.strictEqual(url.type, 'url ')
		assert.strictEqual(url.location, 'a.mp4')
	})

	it('should read an empty location', function () {
		const [url] = readIsoBoxes(urlBox(0, [0]), { readers: { 'url ': readUrl } })

		assert.ok(url)
		assert.strictEqual(url.type, 'url ')
		assert.strictEqual(url.location, '')
	})

	it('should read an empty location from a box that has flag 0x000001 and no string', function () {
		const [url] = readIsoBoxes(urlBox(1, []), { readers: { 'url ': readUrl } })

		assert.ok(url)
		assert.strictEqual(url.type, 'url ')
		assert.strictEqual(url.flags, 1)
		assert.strictEqual(url.location, '')
	})
})
