import { assert, describe, filterBoxes, it, readDref, readUrl, writeUrl } from '../util/box.ts'

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

		assert.strictEqual(writer.byteLength, 13)
		assert.strictEqual(new Uint8Array(writer.buffer)[12], 0)
	})

	it('should omit a location that is not empty when flag 0x000001 is set', function () {
		const writer = writeUrl({ type: 'url ', version: 0, flags: 1, location: 'a.mp4' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 12, 117, 114, 108, 32, 0, 0, 0, 1]),
		)
	})

	it('should write the bytes of a parsed box that has flag 0x000001', function () {
		const [dref] = filterBoxes('captions.mp4', 'dref', {
			readers: { dref: readDref, 'url ': readUrl },
		})
		const [entry] = dref.entries

		assert.strictEqual(entry.type, 'url ')
		assert.strictEqual(entry.flags, 1)

		const { view } = entry as unknown as { view: DataView }
		const input = new Uint8Array(view.buffer, view.byteOffset, view.byteLength)

		assert.deepStrictEqual(new Uint8Array(writeUrl(entry).buffer), new Uint8Array(input))
	})
})
