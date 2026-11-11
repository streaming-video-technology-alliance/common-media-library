import { assert, describe, it, writeSttg, type WebVttSettingsBox } from '../util/box.ts'

describe('writeSttg', function () {
	it('should write a WebVttSettingsBox correctly', function () {
		// #region example
		const box: WebVttSettingsBox = {
			type: 'sttg',
			settings: 'align:start',
		}

		const writer = writeSttg(box)

		// size (20), type (sttg), settings, null terminator
		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 20, 115, 116, 116, 103, 97, 108, 105, 103, 110, 58, 115, 116, 97, 114, 116, 0,
			]),
		)
		// #endregion example
	})

	it('should write the UTF-8 bytes of settings that are not ASCII', function () {
		const writer = writeSttg({ type: 'sttg', settings: 'é日😀' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 18, 115, 116, 116, 103, 195, 169, 230, 151, 165, 240, 159, 152, 128, 0,
			]),
		)
	})

	it('should write the null terminator of empty settings', function () {
		const writer = writeSttg({ type: 'sttg', settings: '' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 9, 115, 116, 116, 103, 0]),
		)
	})
})
