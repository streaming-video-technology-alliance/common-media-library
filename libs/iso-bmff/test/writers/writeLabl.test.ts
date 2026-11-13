import { assert, describe, it, writeLabl, type LabelBox } from '../util/box.ts'

describe('writeLabl', function () {
	it('should write a LabelBox correctly', function () {
		// #region example
		const box: LabelBox = {
			type: 'labl',
			version: 0,
			flags: 0,
			isGroupLabel: false,
			labelId: 1,
			language: 'en',
			label: 'English',
		}

		const writer = writeLabl(box)

		// size (25), type (labl), version and flags, labelId, then each string and a null terminator
		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 25, 108, 97, 98, 108, 0, 0, 0, 0, 0, 1, 101, 110, 0, 69, 110, 103, 108, 105, 115,
				104, 0,
			]),
		)
		// #endregion example
	})

	it('should write the UTF-8 bytes of strings that are not ASCII', function () {
		const writer = writeLabl({
			type: 'labl',
			version: 0,
			flags: 0,
			isGroupLabel: false,
			labelId: 0x0102,
			language: 'é',
			label: '日本',
		})

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 24, 108, 97, 98, 108, 0, 0, 0, 0, 1, 2, 195, 169, 0, 230, 151, 165, 230, 156, 172,
				0,
			]),
		)
	})

	it('should write the null terminator of each empty string', function () {
		const writer = writeLabl({
			type: 'labl',
			version: 0,
			flags: 0,
			isGroupLabel: false,
			labelId: 1,
			language: '',
			label: '',
		})

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 16, 108, 97, 98, 108, 0, 0, 0, 0, 0, 1, 0, 0]),
		)
	})

	it('should write an empty language before a label that is not empty', function () {
		const writer = writeLabl({
			type: 'labl',
			version: 0,
			flags: 0,
			isGroupLabel: false,
			labelId: 1,
			language: '',
			label: 'a',
		})

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 17, 108, 97, 98, 108, 0, 0, 0, 0, 0, 1, 0, 97, 0]),
		)
	})
})
