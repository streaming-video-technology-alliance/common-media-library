import { describe, it } from 'node:test'
import { expectCuesEqualAll } from '../../utils/expectCuesEqualAll.ts'

describe('cuetext/languages tests', () => {

	it('arabic.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/languages/arabic.vtt', './test/webvtt/cuetext/languages/arabic.json')
	})

	it('chinese.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/languages/chinese.vtt', './test/webvtt/cuetext/languages/chinese.json')
	})

	it('greek.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/languages/greek.vtt', './test/webvtt/cuetext/languages/greek.json')
	})

	it('hebrew.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/languages/hebrew.vtt', './test/webvtt/cuetext/languages/hebrew.json')
	})

	it('japanese.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/languages/japanese.vtt', './test/webvtt/cuetext/languages/japanese.json')
	})

	it('korean.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/languages/korean.vtt', './test/webvtt/cuetext/languages/korean.json')
	})

	it('long_string_arabic.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/languages/long_string_arabic.vtt', './test/webvtt/cuetext/languages/long_string_arabic.json')
	})

	it('long_string_chinese.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/languages/long_string_chinese.vtt', './test/webvtt/cuetext/languages/long_string_chinese.json')
	})

	it('long_string_greek.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/languages/long_string_greek.vtt', './test/webvtt/cuetext/languages/long_string_greek.json')
	})

	it('long_string_hebrew.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/languages/long_string_hebrew.vtt', './test/webvtt/cuetext/languages/long_string_hebrew.json')
	})

	it('long_string_japanese.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/languages/long_string_japanese.vtt', './test/webvtt/cuetext/languages/long_string_japanese.json')
	})

	it('long_string_korean.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/languages/long_string_korean.vtt', './test/webvtt/cuetext/languages/long_string_korean.json')
	})

	it('long_string_multiple_languages.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/languages/long_string_multiple_languages.vtt', './test/webvtt/cuetext/languages/long_string_multiple_languages.json')
	})

	it('long_string_russian.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/languages/long_string_russian.vtt', './test/webvtt/cuetext/languages/long_string_russian.json')
	})

	it('long_string_thai.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/languages/long_string_thai.vtt', './test/webvtt/cuetext/languages/long_string_thai.json')
	})

	it('multiple_languages.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/languages/multiple_languages.vtt', './test/webvtt/cuetext/languages/multiple_languages.json')
	})

	it('russian.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/languages/russian.vtt', './test/webvtt/cuetext/languages/russian.json')
	})

	it('thai.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/languages/thai.vtt', './test/webvtt/cuetext/languages/thai.json')
	})

	it('junk_characters.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/languages/junk_characters.vtt', './test/webvtt/cuetext/languages/junk_characters.json')
	})

	it('long_string_junk_characters.vtt', async () => {
		await expectCuesEqualAll('./test/webvtt/cuetext/languages/long_string_junk_characters.vtt', './test/webvtt/cuetext/languages/long_string_junk_characters.json')
	})

})
