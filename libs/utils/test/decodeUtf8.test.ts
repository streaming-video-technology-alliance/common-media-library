import { decodeText, decodeUtf8, UTF_8 } from '@svta/cml-utils'
import { equal } from 'node:assert'
import { describe, it } from 'vite-plus/test'
import { bomBytes, decodeUtf8Cases } from './decodeUtf8Cases.ts'

describe('decodeUtf8', () => {
	it('decodes UTF-8 bytes to a string', () => {
		// #region example
		const bytes = new Uint8Array([0x68, 0x69, 0x20, 0xf0, 0x9f, 0x98, 0x80])

		equal(decodeUtf8(bytes), 'hi 😀')
		// #endregion example
	})

	for (const { name, bytes, expected } of decodeUtf8Cases) {
		it(`decodes ${name} like TextDecoder`, () => {
			const data = new Uint8Array(bytes)
			equal(new TextDecoder().decode(data), expected)
			equal(decodeUtf8(data), expected)
			equal(decodeUtf8(new DataView(data.buffer)), expected)
		})
	}

	it('removes a leading byte order mark like decodeText', () => {
		const data = new Uint8Array(bomBytes)
		equal(decodeUtf8(data), 'hi')
		equal(decodeUtf8(data), decodeText(data, { encoding: UTF_8 }))
	})

	it('reads only the bytes of a DataView with a byte offset', () => {
		const data = new Uint8Array([0x78, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x78])
		equal(decodeUtf8(new DataView(data.buffer, 1, 5)), 'hello')
	})

	it('reads only the bytes of a Uint8Array with a byte offset', () => {
		const data = new Uint8Array([0x78, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x78])
		equal(decodeUtf8(data.subarray(1, 6)), 'hello')
	})
})
