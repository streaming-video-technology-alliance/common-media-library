import { equal } from 'node:assert';
import { describe, it } from 'node:test';
import { isId3Footer } from '../../src/id3/util/isId3Footer.js';

const LEADING_BYTE_SIZE = 8;
const TRAILING_BYTE_SIZE = 8;

describe('isId3Footer', () => {
	const mockID3Footer = Uint8Array.from([
		0x33, 0x44, 0x49, 4, 0, 0, 0, 0, 0, 63, 80, 82, 73, 86, 0, 0, 0, 53, 0, 0,
		99, 111, 109, 46, 97, 112, 112, 108, 101, 46, 115, 116, 114, 101, 97, 109,
		105, 110, 103, 46, 116, 114, 97, 110, 115, 112, 111, 114, 116, 83, 116, 114,
		101, 97, 109, 84, 105, 109, 101, 115, 116, 97, 109, 112, 0, 0, 0, 0, 0, 0,
		13, 198, 135,
	]);
	const mockID3FooterMissingLeadingByte = mockID3Footer.slice(
		LEADING_BYTE_SIZE,
		mockID3Footer.length
	);
	const mockID3FooterMissingTrailingByte = mockID3Footer.slice(
		0,
		mockID3Footer.length - TRAILING_BYTE_SIZE
	);

	it('Properly parses ID3 Footers', () => {
		equal(isId3Footer(mockID3Footer, 0), true);
		equal(isId3Footer(mockID3FooterMissingLeadingByte, 0), false);
		equal(isId3Footer(mockID3FooterMissingTrailingByte, 0), true);
	});
});
