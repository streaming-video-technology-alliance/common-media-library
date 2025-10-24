import { uuidToArrayBuffer } from '@svta/cml-utils'
import { deepEqual } from 'assert'
import { describe, it } from 'node:test'

describe('uuidToArrayBuffer', () => {
	// #region example
	it('should convert a UUID string to ArrayBuffer', () => {
		const uuid = '550e8400-e29b-41d4-a716-446655440000'
		const result = uuidToArrayBuffer(uuid)

		deepEqual(new Uint8Array(result), new Uint8Array([
			0x55, 0x0e, 0x84, 0x00, 0xe2, 0x9b, 0x41, 0xd4,
			0xa7, 0x16, 0x44, 0x66, 0x55, 0x44, 0x00, 0x00,
		]))
	})
	// #endregion example

	it('should handle UUID with uppercase letters', () => {
		const uuid = 'A0564AF7-60C2-D94B-9610-C7AE70D5D970'
		const result = uuidToArrayBuffer(uuid)

		deepEqual(new Uint8Array(result), new Uint8Array([
			0xa0, 0x56, 0x4a, 0xf7, 0x60, 0xc2, 0xd9, 0x4b,
			0x96, 0x10, 0xc7, 0xae, 0x70, 0xd5, 0xd9, 0x70,
		]))
	})

	it('should handle UUID with lowercase letters', () => {
		const uuid = 'a0564af7-60c2-d94b-9610-c7ae70d5d970'
		const result = uuidToArrayBuffer(uuid)

		deepEqual(new Uint8Array(result), new Uint8Array([
			0xa0, 0x56, 0x4a, 0xf7, 0x60, 0xc2, 0xd9, 0x4b,
			0x96, 0x10, 0xc7, 0xae, 0x70, 0xd5, 0xd9, 0x70,
		]))
	})

	it('should handle UUID without hyphens', () => {
		const uuid = '550e8400e29b41d4a716446655440000'
		const result = uuidToArrayBuffer(uuid)

		deepEqual(new Uint8Array(result), new Uint8Array([
			0x55, 0x0e, 0x84, 0x00, 0xe2, 0x9b, 0x41, 0xd4,
			0xa7, 0x16, 0x44, 0x66, 0x55, 0x44, 0x00, 0x00,
		]))
	})

	it('should handle UUID with extra hyphens', () => {
		const uuid = '550e-8400-e29b-41d4-a716-4466-5544-0000'
		const result = uuidToArrayBuffer(uuid)

		deepEqual(new Uint8Array(result), new Uint8Array([
			0x55, 0x0e, 0x84, 0x00, 0xe2, 0x9b, 0x41, 0xd4,
			0xa7, 0x16, 0x44, 0x66, 0x55, 0x44, 0x00, 0x00,
		]))
	})
})
