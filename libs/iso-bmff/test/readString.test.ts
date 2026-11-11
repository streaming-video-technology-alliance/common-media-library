import { assert, describe, it, IsoBoxReadView, readIsoBoxes, readUrl } from './util/box.ts'

const MAIN = [0x6d, 0x61, 0x69, 0x6e] // 'main'

describe('IsoBoxReadView.readString', function () {
	it('should read two null-terminated strings in a row', function () {
		// #region example
		// Two null-terminated strings: 'urn:a' has five bytes, 'main' has four bytes.
		const bytes = new Uint8Array([0x75, 0x72, 0x6e, 0x3a, 0x61, 0x00, 0x6d, 0x61, 0x69, 0x6e, 0x00])
		const view = new IsoBoxReadView(bytes)

		const name = view.readString(-1) // 'urn:a', the view moves six bytes
		const location = view.readString(-1) // 'main', the view moves five bytes
		// #endregion example

		assert.strictEqual(name, 'urn:a')
		assert.strictEqual(location, 'main')
		assert.strictEqual(view.cursor, 11)
		assert.strictEqual(view.bytesRemaining, 0)
	})

	it('should move to the byte after the null byte', function () {
		const view = new IsoBoxReadView(new Uint8Array([...MAIN, 0x00, 0x2a]))

		assert.strictEqual(view.readString(-1), 'main')
		assert.strictEqual(view.cursor, 5)
		assert.strictEqual(view.readUint(1), 0x2a)
		assert.strictEqual(view.done, true)
	})

	it('should read one character for each byte', function () {
		const view = new IsoBoxReadView(new Uint8Array([0xc3, 0xa9, 0x00]))

		assert.strictEqual(view.readString(-1), 'Ã©')
		assert.strictEqual(view.cursor, 3)
	})

	it('should read to the end of the view when the string has no null byte', function () {
		const view = new IsoBoxReadView(new Uint8Array(MAIN))

		assert.strictEqual(view.readString(-1), 'main')
		assert.strictEqual(view.cursor, 4)
		assert.strictEqual(view.bytesRemaining, 0)
	})

	it('should not read past the end of a view that ends inside a buffer', function () {
		const buffer = new Uint8Array([...MAIN, 0x58, 0x59, 0x00])
		const view = new IsoBoxReadView(buffer.subarray(0, 4))

		assert.strictEqual(view.readString(-1), 'main')
		assert.strictEqual(view.cursor, 4)
		assert.strictEqual(view.bytesRemaining, 0)
	})

	it('should not move the view when no bytes remain', function () {
		const view = new IsoBoxReadView(new Uint8Array([0x2a]))

		assert.strictEqual(view.readUint(1), 0x2a)
		assert.strictEqual(view.readString(-1), '')
		assert.strictEqual(view.cursor, 1)
		assert.strictEqual(view.bytesRemaining, 0)
	})

	it('should read the number of bytes of a positive size', function () {
		const view = new IsoBoxReadView(new Uint8Array(MAIN))

		assert.strictEqual(view.readString(2), 'ma')
		assert.strictEqual(view.cursor, 2)
		assert.strictEqual(view.readString(2), 'in')
		assert.strictEqual(view.done, true)
	})

	it('should leave the view at the end of a url box that has no string', function () {
		// A `url ` box with flag 0x000001 and no location string.
		const bytes = new Uint8Array([0, 0, 0, 12, 0x75, 0x72, 0x6c, 0x20, 0, 0, 0, 1])
		let bytesRemaining = NaN

		const [url] = readIsoBoxes(bytes, {
			readers: {
				url: (view: IsoBoxReadView) => {
					const box = readUrl(view)
					bytesRemaining = view.bytesRemaining
					return box
				},
			},
		})

		assert.ok(url)
		assert.strictEqual(url.type, 'url ')
		assert.strictEqual(url.location, '')
		assert.strictEqual(bytesRemaining, 0)
	})
})
