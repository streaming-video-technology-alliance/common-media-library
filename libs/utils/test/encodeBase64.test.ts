import { decodeBase64, encodeBase64 } from '@svta/cml-utils'
import assert from 'node:assert'
import test from 'node:test'

test('encodeBase64', () => {
	//#region example
	assert.deepStrictEqual(encodeBase64(new Uint8Array([104, 101, 108, 108, 111])), 'aGVsbG8=')
	//#endregion example
	assert.deepStrictEqual(encodeBase64(new Uint8Array([])), '')
	assert.deepStrictEqual(encodeBase64(new Uint8Array([1])), 'AQ==')
	assert.deepStrictEqual(encodeBase64(new Uint8Array([1, 2])), 'AQI=')
	assert.deepStrictEqual(encodeBase64(new Uint8Array([1, 2, 3])), 'AQID')
	assert.deepStrictEqual(encodeBase64(new Uint8Array([255, 254, 253])), '//79')
})

test('encodeBase64 encodes a view with an offset', () => {
	const bytes = new Uint8Array([9, 9, 1, 2, 3, 9])
	assert.deepStrictEqual(encodeBase64(bytes.subarray(2, 5)), 'AQID')
})

test('encodeBase64 handles inputs above the argument limit', () => {
	const bytes = new Uint8Array(200_000).map((_, i) => i & 255)
	const encoded = encodeBase64(bytes)
	assert.deepStrictEqual(encoded.length, 266_668)
	assert.deepStrictEqual(decodeBase64(encoded), bytes)
})
