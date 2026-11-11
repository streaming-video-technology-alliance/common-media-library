import { assert, describe, it, writeIden, type WebVttCueIdBox } from '../util/box.ts'

describe('writeIden', function () {
	it('should write a WebVttCueIdBox correctly', function () {
		// #region example
		const box: WebVttCueIdBox = {
			type: 'iden',
			cueId: 'cue-1',
		}

		const writer = writeIden(box)

		// size (14), type (iden), cueId, null terminator
		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 14, 105, 100, 101, 110, 99, 117, 101, 45, 49, 0]),
		)
		// #endregion example
	})

	it('should write the UTF-8 bytes of a cueId that is not ASCII', function () {
		const writer = writeIden({ type: 'iden', cueId: 'é日😀' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 18, 105, 100, 101, 110, 195, 169, 230, 151, 165, 240, 159, 152, 128, 0,
			]),
		)
	})

	it('should write the null terminator of an empty cueId', function () {
		const writer = writeIden({ type: 'iden', cueId: '' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 9, 105, 100, 101, 110, 0]),
		)
	})
})
