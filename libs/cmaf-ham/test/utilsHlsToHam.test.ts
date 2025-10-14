import { deepStrictEqual, equal } from 'node:assert'
import { describe, it } from 'node:test'

import type { HlsManifest } from '@svta/cml-cmaf-ham'
import { decodeByteRange, formatSegments, getDuration, getHlsCodec } from '@svta/cml-cmaf-ham'

import { getSegments } from './data/hlsData.ts'

describe('getByterange', () => {
	it('returns byterange in hsl format if byterange exists', () => {
		const res = decodeByteRange({ length: 123, offset: 456 })
		equal(res, '123@456')
	})

	it('returns empty string if byterange does not exist', () => {
		const res = decodeByteRange(undefined)
		equal(res, '')
	})
})

describe('getCodec', () => {
	it('returns audio codec when type is audio', () => {
		const res = getHlsCodec('audio')
		equal(res, 'mp4a.40.2')
	})

	it('returns empty string when type is text', () => {
		const res = getHlsCodec('text')
		equal(res, '')
	})

	it('returns video codec when type is video', () => {
		const res = getHlsCodec('video', 'videoCodec,otherCodec,anotherCodec')
		equal(res, 'videoCodec')
	})
	it('returns empty string when type is video and codecs is empty', () => {
		const res = getHlsCodec('video', '')
		equal(res, '')
	})
})

describe('getDuration', () => {
	it('returns null if manifest is empty', () => {
		const res = getDuration({} as HlsManifest, getSegments())
		equal(res, null)
	})

	it('returns duration if manifest has targetDuration and there are segments', () => {
		const res = getDuration(
			{ targetDuration: 3 } as HlsManifest,
			getSegments(),
		)
		equal(res, 6)
	})
})

describe('formatSegments', () => {
	it('returns segments formated', () => {
		const res = formatSegments(getSegments())
		deepStrictEqual(res, [
			{
				duration: 4.011,
				url: 'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-s1.mp4',
				byteRange: '12@34',
			},
			{
				duration: 3.989,
				url: 'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/a-eng-0384k-aac-6c-s2.mp4',
				byteRange: '56@78',
			},
		])
	})

	it('returns empty array if segments is empty', () => {
		const res = formatSegments([])
		deepStrictEqual(res, [])
	})
})
