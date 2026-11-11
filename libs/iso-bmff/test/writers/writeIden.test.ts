import {
	assert,
	defaultReaderConfig,
	defaultWriterConfig,
	describe,
	filterIsoBoxes,
	findBox,
	it,
	readIsoBoxes,
	writeIden,
	writeIsoBox,
	type WebVttCueIdBox,
} from '../util/box.ts'

describe('writeIden', function () {
	it('should write a WebVttCueIdBox correctly', function () {
		// #region example
		const box: WebVttCueIdBox = {
			type: 'iden',
			cueId: 'cue-1',
		}

		const writer = writeIden(box)

		// size (13), type (iden), cueId
		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 13, 105, 100, 101, 110, 99, 117, 101, 45, 49]),
		)
		// #endregion example
	})

	it('should write the UTF-8 bytes of a cueId that is not ASCII', function () {
		const writer = writeIden({ type: 'iden', cueId: 'é日😀' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 17, 105, 100, 101, 110, 195, 169, 230, 151, 165, 240, 159, 152, 128,
			]),
		)
	})

	it('should write only the box header for an empty cueId', function () {
		const writer = writeIden({ type: 'iden', cueId: '' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 8, 105, 100, 101, 110]),
		)
	})

	it('should write the input bytes of every iden box in vttc.mp4', function () {
		const config = defaultReaderConfig()
		const { data } = findBox('vttc.mp4', 'mdat', config)
		const boxes = filterIsoBoxes(readIsoBoxes(data, config), box => box.type === 'iden')

		assert.strictEqual(boxes.length, 2)

		for (const box of boxes) {
			const { view } = box

			assert.deepStrictEqual(
				writeIsoBox(box, defaultWriterConfig()),
				new Uint8Array(view.buffer, view.byteOffset, view.byteLength),
			)
		}
	})
})
