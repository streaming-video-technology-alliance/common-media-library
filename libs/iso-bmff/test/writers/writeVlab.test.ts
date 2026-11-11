import { assert, describe, it, writeVlab, type WebVttSourceLabelBox } from '../util/box.ts'

describe('writeVlab', function () {
	it('should write a WebVttSourceLabelBox correctly', function () {
		// #region example
		const box: WebVttSourceLabelBox = {
			type: 'vlab',
			sourceLabel: 'source',
		}

		const writer = writeVlab(box)

		// size (15), type (vlab), sourceLabel, null terminator
		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 15, 118, 108, 97, 98, 115, 111, 117, 114, 99, 101, 0]),
		)
		// #endregion example
	})

	it('should write the UTF-8 bytes of a sourceLabel that is not ASCII', function () {
		const writer = writeVlab({ type: 'vlab', sourceLabel: 'é日😀' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 18, 118, 108, 97, 98, 195, 169, 230, 151, 165, 240, 159, 152, 128, 0,
			]),
		)
	})

	it('should write the null terminator of an empty sourceLabel', function () {
		const writer = writeVlab({ type: 'vlab', sourceLabel: '' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 9, 118, 108, 97, 98, 0]),
		)
	})
})
