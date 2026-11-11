import {
	assert,
	defaultReaderConfig,
	defaultWriterConfig,
	describe,
	filterIsoBoxes,
	findBox,
	it,
	readIsoBoxes,
	writeIsoBox,
	writePayl,
	type WebVttCuePayloadBox,
} from '../util/box.ts'

describe('writePayl', function () {
	it('should write a WebVttCuePayloadBox correctly', function () {
		// #region example
		const box: WebVttCuePayloadBox = {
			type: 'payl',
			cueText: 'Hello world',
		}

		const writer = writePayl(box)

		// size (19), type (payl), cueText
		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 19, 112, 97, 121, 108, 72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100,
			]),
		)
		// #endregion example
	})

	it('should write the UTF-8 bytes of a cueText that is not ASCII', function () {
		const writer = writePayl({ type: 'payl', cueText: 'é日😀' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 17, 112, 97, 121, 108, 195, 169, 230, 151, 165, 240, 159, 152, 128]),
		)
	})

	it('should write only the box header for an empty cueText', function () {
		const writer = writePayl({ type: 'payl', cueText: '' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 8, 112, 97, 121, 108]),
		)
	})

	for (const [file, count] of [
		['vttc.mp4', 1],
		['webvtt.m4s', 3],
	] as const) {
		it(`should write the input bytes of every payl box in ${file}`, function () {
			const config = defaultReaderConfig()
			const { data } = findBox(file, 'mdat', config)
			const boxes = filterIsoBoxes(readIsoBoxes(data, config), box => box.type === 'payl')

			assert.strictEqual(boxes.length, count)

			for (const box of boxes) {
				const { view } = box

				assert.deepStrictEqual(
					writeIsoBox(box, defaultWriterConfig()),
					new Uint8Array(view.buffer, view.byteOffset, view.byteLength),
				)
			}
		})
	}
})
