import { assert, describe, it, writeElng, type ExtendedLanguageBox } from '../util/box.ts'

describe('writeElng', function () {
	it('should write an ExtendedLanguageBox correctly', function () {
		// #region example
		const box: ExtendedLanguageBox = {
			type: 'elng',
			version: 0,
			flags: 0,
			extendedLanguage: 'en-US',
		}

		const writer = writeElng(box)

		// size (18), type (elng), version and flags, extendedLanguage, null terminator
		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 18, 101, 108, 110, 103, 0, 0, 0, 0, 101, 110, 45, 85, 83, 0]),
		)
		// #endregion example
	})

	it('should write the UTF-8 bytes of an extendedLanguage that is not ASCII', function () {
		const writer = writeElng({ type: 'elng', version: 0, flags: 0, extendedLanguage: 'é日😀' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 22, 101, 108, 110, 103, 0, 0, 0, 0, 195, 169, 230, 151, 165, 240, 159, 152, 128, 0,
			]),
		)
	})

	it('should write the null terminator of an empty extendedLanguage', function () {
		const writer = writeElng({ type: 'elng', version: 0, flags: 0, extendedLanguage: '' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 13, 101, 108, 110, 103, 0, 0, 0, 0, 0]),
		)
	})
})
