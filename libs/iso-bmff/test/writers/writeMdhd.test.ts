import { writeWith } from '../util/writeWith.ts'
import {
	assert,
	describe,
	isIsoBoxType,
	it,
	readIsoBoxes,
	readMdhd,
	writeMdhd,
	type MediaHeaderBox,
} from '../util/box.ts'

function languageBytes(language: string): number {
	const box: MediaHeaderBox = {
		type: 'mdhd',
		version: 0,
		flags: 0,
		creationTime: 0,
		modificationTime: 0,
		timescale: 1000,
		duration: 0,
		language,
	}
	const bytes = writeWith(writeMdhd, box)

	return new DataView(bytes.buffer).getUint16(28)
}

describe('writeMdhd', function () {
	it('should pack a language of 3 lower-case letters', function () {
		assert.strictEqual(languageBytes('eng'), 0x15c7)
	})

	for (const language of ['en', 'en-US', 'ENG', '']) {
		it(`should write the code of und for the language '${language}'`, function () {
			assert.strictEqual(languageBytes(language), 0x55c4)
		})
	}

	it('should write the bytes of a language that readMdhd returns', function () {
		const bytes = writeWith(writeMdhd, {
			type: 'mdhd',
			version: 0,
			flags: 0,
			creationTime: 0,
			modificationTime: 0,
			timescale: 1000,
			duration: 0,
			language: 'en',
		})
		const [box] = readIsoBoxes(bytes, { readers: { mdhd: readMdhd } })

		assert.ok(isIsoBoxType('mdhd', box))
		assert.strictEqual(box.language, 'und')
		assert.deepStrictEqual(writeWith(writeMdhd, box), bytes)
	})
})
