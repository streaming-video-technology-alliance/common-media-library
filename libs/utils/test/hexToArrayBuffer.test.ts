import { hexToArrayBuffer } from '@svta/cml-utils'
import { deepEqual } from 'assert'
import { describe, it } from 'node:test'

describe('hexToArrayBuffer', () => {
	it('should convert hex string to ArrayBuffer', () => {
		//#region example
		const hex = 'a0564af760c2d94b9610c7ae70d5d970'
		const result = hexToArrayBuffer(hex)

		const expected = new Uint8Array([
			160, 86, 74, 247,
			96, 194,
			217, 75,
			150, 16,
			199, 174, 112, 213, 217, 112,
		])

		deepEqual(new Uint8Array(result), expected)
		//#endregion example
	})

	it('should handle empty string', () => {
		const hex = ''
		const result = hexToArrayBuffer(hex)

		deepEqual(result.byteLength, 0)
	})

	it('should handle uppercase hex', () => {
		const hex = 'A0564AF760C2D94B9610C7AE70D5D970'
		const result = hexToArrayBuffer(hex)

		const expected = new Uint8Array([
			160, 86, 74, 247,
			96, 194,
			217, 75,
			150, 16,
			199, 174, 112, 213, 217, 112,
		])

		deepEqual(new Uint8Array(result), expected)
	})

	it('should handle mixed case hex', () => {
		const hex = 'aB12Cd34'
		const result = hexToArrayBuffer(hex)

		const expected = new Uint8Array([171, 18, 205, 52])

		deepEqual(new Uint8Array(result), expected)
	})
})
