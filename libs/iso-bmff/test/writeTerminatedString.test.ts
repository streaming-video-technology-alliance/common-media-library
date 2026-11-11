import { assert, describe, it, IsoBoxWriteView } from './util/box.ts'

// The bytes after the 8-byte box header.
function body(writer: IsoBoxWriteView): number[] {
	return Array.from(new Uint8Array(writer.buffer).subarray(8))
}

describe('IsoBoxWriteView.writeTerminatedString', function () {
	it('should write one byte for each character and a null byte', function () {
		// #region example
		const writer = new IsoBoxWriteView('test', 14)
		writer.writeTerminatedString('main') // the bytes 6d 61 69 6e 00
		writer.writeUint(0x2a, 1)
		// #endregion example

		assert.deepStrictEqual(body(writer), [0x6d, 0x61, 0x69, 0x6e, 0x00, 0x2a])
	})

	it('should write only the null byte for an empty string', function () {
		const writer = new IsoBoxWriteView('test', 10)
		writer.writeTerminatedString('')
		writer.writeUint(0x2a, 1)

		assert.deepStrictEqual(body(writer), [0x00, 0x2a])
	})

	it('should write one byte for a character below U+0100', function () {
		const writer = new IsoBoxWriteView('test', 11)
		writer.writeTerminatedString('é')
		writer.writeUint(0x2a, 1)

		assert.deepStrictEqual(body(writer), [0xe9, 0x00, 0x2a])
	})
})
