import { arrayBufferToUuid } from '@svta/cml-utils'
import { equal } from 'assert/strict'
import { describe, it } from 'node:test'

describe('arrayBufferToUuid', () => {
	function hexStringToArrayBuffer(hex: string): ArrayBuffer {
		const cleanHex = hex.replace(/-/g, '')
		const buffer = new ArrayBuffer(cleanHex.length / 2)
		const view = new Uint8Array(buffer)
		for (let i = 0; i < cleanHex.length; i += 2) {
			view[i / 2] = parseInt(cleanHex.substr(i, 2), 16)
		}
		return buffer
	}

	it('should convert 16-byte ArrayBuffer to UUID format', () => {
		//#region example
		const data = new Uint8Array([
			160, 86, 74, 247,
			96, 194,
			217, 75,
			150, 16,
			199, 174, 112, 213, 217, 112,
		])
		const result = arrayBufferToUuid(data.buffer)

		equal(result, 'a0564af7-60c2-d94b-9610-c7ae70d5d970')
		//#endregion example
	})

	it('should handle empty buffer', () => {
		const buffer = new ArrayBuffer(0)
		const result = arrayBufferToUuid(buffer)

		equal(result, '')
	})

	it('should handle non-16-byte buffer', () => {
		const buffer = hexStringToArrayBuffer('123456')
		const result = arrayBufferToUuid(buffer)

		equal(result, '123456')
	})
})
