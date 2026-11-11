import { assert, describe, it, writeKind, type TrackKindBox } from '../util/box.ts'

describe('writeKind', function () {
	it('should write a TrackKindBox correctly', function () {
		// #region example
		const box: TrackKindBox = {
			type: 'kind',
			version: 0,
			flags: 0,
			schemeUri: 'urn:mpeg:dash:role:2011',
			value: 'main',
		}

		const writer = writeKind(box)

		// size (41), type (kind), version and flags, then each string and a null terminator
		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 41, 107, 105, 110, 100, 0, 0, 0, 0, 117, 114, 110, 58, 109, 112, 101, 103, 58, 100,
				97, 115, 104, 58, 114, 111, 108, 101, 58, 50, 48, 49, 49, 0, 109, 97, 105, 110, 0,
			]),
		)
		// #endregion example
	})

	it('should write the UTF-8 bytes of strings that are not ASCII', function () {
		const writer = writeKind({
			type: 'kind',
			version: 0,
			flags: 0,
			schemeUri: 'urn:é',
			value: '日本',
		})

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 26, 107, 105, 110, 100, 0, 0, 0, 0, 117, 114, 110, 58, 195, 169, 0, 230, 151, 165,
				230, 156, 172, 0,
			]),
		)
	})

	it('should write the null terminator of each empty string', function () {
		const writer = writeKind({ type: 'kind', version: 0, flags: 0, schemeUri: '', value: '' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 14, 107, 105, 110, 100, 0, 0, 0, 0, 0, 0]),
		)
	})

	it('should write an empty schemeUri before a value that is not empty', function () {
		const writer = writeKind({ type: 'kind', version: 0, flags: 0, schemeUri: '', value: 'a' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 15, 107, 105, 110, 100, 0, 0, 0, 0, 0, 97, 0]),
		)
	})
})
