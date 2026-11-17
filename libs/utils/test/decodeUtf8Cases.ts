export type DecodeUtf8Case = {
	name: string
	bytes: number[]
	expected: string
}

export const decodeUtf8Cases: DecodeUtf8Case[] = [
	{ name: 'empty input', bytes: [], expected: '' },
	{ name: 'ASCII', bytes: [0x68, 0x65, 0x6c, 0x6c, 0x6f], expected: 'hello' },
	{ name: 'a 2-byte character', bytes: [0xc2, 0xa9], expected: '©' },
	{ name: 'a 3-byte character', bytes: [0xe2, 0x82, 0xbf], expected: '₿' },
	{ name: 'a 4-byte character', bytes: [0x61, 0xf0, 0x9f, 0x98, 0x80, 0x62], expected: 'a😀b' },
	{ name: 'the highest code point', bytes: [0xf4, 0x8f, 0xbf, 0xbf], expected: '\u{10ffff}' },
	{ name: 'an invalid byte', bytes: [0x61, 0xff, 0x62], expected: 'a\ufffdb' },
	{ name: 'a continuation byte with no lead byte', bytes: [0x80, 0x61], expected: '\ufffda' },
	{ name: 'an overlong 2-byte sequence', bytes: [0xc0, 0x80], expected: '\ufffd\ufffd' },
	{
		name: 'an overlong 3-byte sequence',
		bytes: [0xe0, 0x80, 0x80],
		expected: '\ufffd\ufffd\ufffd',
	},
	{ name: 'an encoded surrogate', bytes: [0xed, 0xa0, 0x80], expected: '\ufffd\ufffd\ufffd' },
	{
		name: 'a code point above U+10FFFF',
		bytes: [0xf4, 0x90, 0x80, 0x80],
		expected: '\ufffd\ufffd\ufffd\ufffd',
	},
	{ name: 'a short sequence before a valid byte', bytes: [0xe2, 0x82, 0x61], expected: '\ufffda' },
	{ name: 'a short sequence at the end', bytes: [0x61, 0xf0, 0x9f, 0x98], expected: 'a\ufffd' },
]

/** UTF-8 byte order mark, then "hi" */
export const bomBytes: number[] = [0xef, 0xbb, 0xbf, 0x68, 0x69]
