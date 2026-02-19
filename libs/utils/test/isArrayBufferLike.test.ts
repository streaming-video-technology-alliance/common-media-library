import { isArrayBufferLike } from '@svta/cml-utils'
import { equal } from 'assert/strict'
import { describe, it } from 'node:test'

describe('isArrayBufferLike', () => {
	it('should return true for ArrayBuffer', () => {
		//#region example
		const buffer = new ArrayBuffer(8)

		equal(isArrayBufferLike(buffer), true)
		//#endregion example
	})

	it('should return true for SharedArrayBuffer when available', () => {
		if (typeof SharedArrayBuffer !== 'undefined') {
			const shared = new SharedArrayBuffer(8)

			equal(isArrayBufferLike(shared), true)
		}
	})

	it('should return false for Uint8Array', () => {
		const array = new Uint8Array(8)

		equal(isArrayBufferLike(array), false)
	})

	it('should return false for DataView', () => {
		const view = new DataView(new ArrayBuffer(8))

		equal(isArrayBufferLike(view), false)
	})

	it('should return false for null', () => {
		equal(isArrayBufferLike(null), false)
	})

	it('should return false for undefined', () => {
		equal(isArrayBufferLike(undefined), false)
	})

	it('should return false for plain objects', () => {
		equal(isArrayBufferLike({ byteLength: 8 }), false)
	})

	it('should return false for numbers', () => {
		equal(isArrayBufferLike(42), false)
	})
})
