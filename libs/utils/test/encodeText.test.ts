import { encodeText } from '@svta/cml-utils'
import { deepEqual } from 'node:assert'
import { describe, it } from 'node:test'

describe('encodeText', () => {
	it('converts string to Uint8Array', () => {
		// #region example
		const str = 'hello world'
		const encoded = new Uint8Array([
			104, 101, 108, 108,
			111, 32, 119, 111,
			114, 108, 100
		])

		deepEqual(encodeText(str), encoded)
		// #endregion example
	})

	it('converts string to Uint8Array', () => {
		const str = 'hello world with UTF-16 characters: 😀🚀🌟'
		const encoded = new Uint8Array([
			104, 101, 108, 108, 111, 32, 119, 111, 114,
			108, 100, 32, 119, 105, 116, 104, 32, 85,
			84, 70, 45, 49, 54, 32, 99, 104, 97,
			114, 97, 99, 116, 101, 114, 115, 58, 32,
			240, 159, 152, 128, 240, 159, 154, 128, 240,
			159, 140, 159
		])

		deepEqual(encodeText(str), encoded)
	})

	it('handles empty strings', () => {
		const encoded = new Uint8Array(0)
		deepEqual(encodeText(''), encoded)
	})
})
