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
	writeSttg,
	type WebVttSettingsBox,
} from '../util/box.ts'

describe('writeSttg', function () {
	it('should write a WebVttSettingsBox correctly', function () {
		// #region example
		const box: WebVttSettingsBox = {
			type: 'sttg',
			settings: 'align:start',
		}

		const writer = writeSttg(box)

		// size (19), type (sttg), settings
		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 19, 115, 116, 116, 103, 97, 108, 105, 103, 110, 58, 115, 116, 97, 114, 116,
			]),
		)
		// #endregion example
	})

	it('should write the UTF-8 bytes of settings that are not ASCII', function () {
		const writer = writeSttg({ type: 'sttg', settings: 'é日😀' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([
				0, 0, 0, 17, 115, 116, 116, 103, 195, 169, 230, 151, 165, 240, 159, 152, 128,
			]),
		)
	})

	it('should write only the box header for empty settings', function () {
		const writer = writeSttg({ type: 'sttg', settings: '' })

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			new Uint8Array([0, 0, 0, 8, 115, 116, 116, 103]),
		)
	})

	it('should write the input bytes of the sttg box in vttc.mp4', function () {
		const config = defaultReaderConfig()
		const { data } = findBox('vttc.mp4', 'mdat', config)
		const boxes = filterIsoBoxes(readIsoBoxes(data, config), box => box.type === 'sttg')

		assert.strictEqual(boxes.length, 1)

		for (const box of boxes) {
			const { view } = box

			assert.deepStrictEqual(
				writeIsoBox(box, defaultWriterConfig()),
				new Uint8Array(view.buffer, view.byteOffset, view.byteLength),
			)
		}
	})
})
