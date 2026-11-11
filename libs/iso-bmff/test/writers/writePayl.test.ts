import { assert, describe, it, writePayl, type WebVttCuePayloadBox } from '../util/box.ts'

describe('writePayl', function () {
	it('should write a WebVttCuePayloadBox correctly', function () {
		// #region example
		const box: WebVttCuePayloadBox = {
			type: 'payl',
			cueText: 'Hello world',
		}

		const writer = writePayl(box)

		// size (20), type (payl), cueText, null terminator
		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 20, 112, 97, 121, 108, 72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 0,
			]),
		)
		// #endregion example
	})

	it('should write the UTF-8 bytes of a cueText that is not ASCII', function () {
		const writer = writePayl({ type: 'payl', cueText: 'é日😀' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 18, 112, 97, 121, 108, 195, 169, 230, 151, 165, 240, 159, 152, 128, 0,
			]),
		)
	})

	it('should write the null terminator of an empty cueText', function () {
		const writer = writePayl({ type: 'payl', cueText: '' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 9, 112, 97, 121, 108, 0]),
		)
	})
})
