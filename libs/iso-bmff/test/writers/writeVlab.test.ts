import { assert, describe, it, writeVlab, type WebVttSourceLabelBox } from '../util/box.ts'

describe('writeVlab', function () {
	it('should write a WebVttSourceLabelBox correctly', function () {
		// #region example
		const box: WebVttSourceLabelBox = {
			type: 'vlab',
			sourceLabel: 'source',
		}

		const writer = writeVlab(box)

		// size (14), type (vlab), sourceLabel
		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 14, 118, 108, 97, 98, 115, 111, 117, 114, 99, 101]),
		)
		// #endregion example
	})

	it('should write the UTF-8 bytes of a sourceLabel that is not ASCII', function () {
		const writer = writeVlab({ type: 'vlab', sourceLabel: 'é日😀' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 17, 118, 108, 97, 98, 195, 169, 230, 151, 165, 240, 159, 152, 128]),
		)
	})

	it('should write only the box header for an empty sourceLabel', function () {
		const writer = writeVlab({ type: 'vlab', sourceLabel: '' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 8, 118, 108, 97, 98]),
		)
	})
})
