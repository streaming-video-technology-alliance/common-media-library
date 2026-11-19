import { strictEqual } from 'node:assert'
import { isIsoBoxType, readHdlr, readIsoBoxes } from '@svta/cml-iso-bmff'
import { describe, it } from 'vite-plus/test'
import { boxBytes } from './util/wideBoxes.ts'

// The string bytes: 'é€😀', one invalid byte, 'a', and the null terminator.
const NAME = new Uint8Array([
	0xc3, 0xa9, 0xe2, 0x82, 0xac, 0xf0, 0x9f, 0x98, 0x80, 0xff, 0x61, 0x00,
])
const HDLR = boxBytes('hdlr', [0, 1], [0, 3], [0, 4], [0x76696465, 4], [0, 4], [0, 4], [0, 4], NAME)

function readName(): string {
	const [box] = readIsoBoxes(HDLR, { readers: { hdlr: readHdlr } })

	return isIsoBoxType('hdlr', box) ? box.name : ''
}

describe('UTF-8 strings in a runtime without TextDecoder', () => {
	it('should read the same string as with TextDecoder', () => {
		const withDecoder = readName()
		const NativeTextDecoder = globalThis.TextDecoder

		// @ts-expect-error - simulate a runtime without TextDecoder
		delete globalThis.TextDecoder

		try {
			strictEqual(withDecoder, 'é€😀�a')
			strictEqual(readName(), withDecoder)
		} finally {
			globalThis.TextDecoder = NativeTextDecoder
		}
	})
})
