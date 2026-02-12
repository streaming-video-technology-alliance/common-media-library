import { parsePsshList } from '@svta/cml-drm'
import { deepStrictEqual, ok, strictEqual } from 'node:assert'
import { describe, it } from 'node:test'
import { samplePsshBox } from '../common/samplePsshBox.ts'

describe('parsePsshList', () => {
	it('should return an object with the correct UUID and PSSH box', () => {
		//#region example
		const initData = new Uint8Array(samplePsshBox).buffer
		const result = parsePsshList(initData)
		//#endregion example
		const expectedUUID = '1077efec-c0b2-4d02-ace3-3c1e52e2fb4b'

		strictEqual(Object.keys(result).length, 1) // should have one key
		strictEqual(Object.keys(result)[0], expectedUUID)

		const psshBox = result[expectedUUID]
		strictEqual(psshBox.byteLength, samplePsshBox.length) // length should match
		deepStrictEqual(new Uint8Array(psshBox), samplePsshBox)  // actual data should match
	})

	it('should parse PSSH boxes from a Uint8Array', () => {
		const initData = new Uint8Array(samplePsshBox)
		const result = parsePsshList(initData)
		const expectedUUID = '1077efec-c0b2-4d02-ace3-3c1e52e2fb4b'

		strictEqual(Object.keys(result).length, 1)
		strictEqual(Object.keys(result)[0], expectedUUID)

		const psshBox = result[expectedUUID]
		ok(psshBox instanceof Uint8Array, 'result value should be a Uint8Array')
		strictEqual(psshBox.byteLength, samplePsshBox.length)
		deepStrictEqual(psshBox, samplePsshBox)
	})

	it('should parse PSSH boxes from a Uint8Array subarray with non-zero byteOffset', () => {
		// Create a larger buffer with padding before the PSSH box
		const padding = new Uint8Array(100).fill(0xFF)
		const combined = new Uint8Array(padding.length + samplePsshBox.length)
		combined.set(padding, 0)
		combined.set(samplePsshBox, padding.length)

		// Create a subarray that starts at the PSSH box (non-zero byteOffset)
		const initData = combined.subarray(padding.length)
		const result = parsePsshList(initData)
		const expectedUUID = '1077efec-c0b2-4d02-ace3-3c1e52e2fb4b'

		strictEqual(Object.keys(result).length, 1)
		strictEqual(Object.keys(result)[0], expectedUUID)

		const psshBox = result[expectedUUID]
		ok(psshBox instanceof Uint8Array, 'result value should be a Uint8Array')
		strictEqual(psshBox.byteLength, samplePsshBox.length)
		deepStrictEqual(psshBox, samplePsshBox)
	})
})
