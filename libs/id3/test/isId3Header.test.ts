import { isId3Header } from '@svta/cml-id3'
import { equal } from 'node:assert'
import { describe, it } from 'node:test'

const LEADING_BYTE_SIZE = 8
const TRAILING_BYTE_SIZE = 8

describe('isId3Header', () => {
	const mockID3Header = Uint8Array.from([
		73, 68, 51, 4, 0, 0, 0, 0, 0, 63, 80, 82, 73, 86, 0, 0, 0, 53, 0, 0, 99,
		111, 109, 46, 97, 112, 112, 108, 101, 46, 115, 116, 114, 101, 97, 109, 105,
		110, 103, 46, 116, 114, 97, 110, 115, 112, 111, 114, 116, 83, 116, 114, 101,
		97, 109, 84, 105, 109, 101, 115, 116, 97, 109, 112, 0, 0, 0, 0, 0, 0, 13,
		198, 135,
	])
	const mockID3HeaderMissingLeadingByte = mockID3Header.slice(
		LEADING_BYTE_SIZE,
		mockID3Header.length,
	)
	const mockID3HeaderMissingTrailingByte = mockID3Header.slice(
		0,
		mockID3Header.length - TRAILING_BYTE_SIZE,
	)

	it('Properly parses ID3 Headers', () => {
		equal(isId3Header(mockID3Header, 0), true)
		equal(isId3Header(mockID3HeaderMissingLeadingByte, 0), false)
		equal(isId3Header(mockID3HeaderMissingTrailingByte, 0), true)
	})
})
