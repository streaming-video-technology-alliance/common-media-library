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
import { boxBytes } from '../util/wideBoxes.ts'

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

	it('should pack the first and the last character of the range', function () {
		// Each character is 5 bits: U+0060 is 0 and U+007F is 31.
		assert.strictEqual(languageBytes('```'), 0x0000)
		assert.strictEqual(languageBytes('\u007f\u007f\u007f'), 0x7fff)
	})

	// 'en_' has U+005F, the last character below the range. 'en\u0080' has the first character above it.
	// 'engl' has 4 characters of the range.
	for (const language of ['en', 'en-US', 'ENG', '', 'en_', 'en\u0080', 'engl']) {
		it(`should throw a RangeError for the language ${JSON.stringify(language)}`, function () {
			assert.throws(
				() => languageBytes(language),
				(error: unknown) =>
					error instanceof RangeError &&
					error.message.includes('language') &&
					error.message.endsWith(` received ${language}`),
			)
		})
	}

	it('should throw a RangeError for a language that is not a string', function () {
		assert.throws(
			() => languageBytes(['e', 'n', 'g'] as never),
			/^RangeError: .*language.* received e,n,g$/,
		)
	})

	it('should write the bytes of a language that readMdhd returns', function () {
		// A language field of 0 reads as three characters U+0060.
		const source = boxBytes('mdhd', [0, 4], [0, 4], [0, 4], [1000, 4], [0, 4], [0, 2], [0, 2])
		const [box] = readIsoBoxes(source, { readers: { mdhd: readMdhd } })

		assert.ok(isIsoBoxType('mdhd', box))
		assert.strictEqual(box.language, '```')
		assert.deepStrictEqual(writeWith(writeMdhd, box), source)
	})
})
