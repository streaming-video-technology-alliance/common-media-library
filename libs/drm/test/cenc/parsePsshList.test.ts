import { parsePsshList } from '@svta/cml-drm'
import { deepStrictEqual, ok, strictEqual } from 'node:assert'
import { describe, it } from 'vite-plus/test'
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
		deepStrictEqual(new Uint8Array(psshBox), samplePsshBox) // actual data should match
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
		const padding = new Uint8Array(100).fill(0xff)
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

function box(type: string, length: number, size = length): Uint8Array {
	const data = new Uint8Array(length)
	const view = new DataView(data.buffer)
	view.setUint32(0, size)
	for (let i = 0; i < 4; i++) {
		data[4 + i] = type.charCodeAt(i)
	}
	return data
}

function concat(...parts: Uint8Array[]): Uint8Array {
	const data = new Uint8Array(parts.reduce((size, part) => size + part.length, 0))
	let offset = 0
	for (const part of parts) {
		data.set(part, offset)
		offset += part.length
	}
	return data
}

function toBytes(data: ArrayBufferLike | Uint8Array): Uint8Array {
	return data instanceof Uint8Array ? data : new Uint8Array(data)
}

const uuid = '00000000-0000-0000-0000-000000000000'

for (const inputType of ['buffer', 'subarray'] as const) {
	describe(`parsePsshList boundaries (${inputType})`, () => {
		function parse(data: Uint8Array) {
			if (inputType === 'buffer') {
				return parsePsshList(new Uint8Array(data).buffer)
			}
			const padded = concat(new Uint8Array(5).fill(255), data, new Uint8Array(5).fill(255))
			return parsePsshList(padded.subarray(5, 5 + data.length))
		}

		it('stops at a truncated header and preserves previous boxes', () => {
			for (let length = 1; length < 8; length++) {
				deepStrictEqual(parse(new Uint8Array(length)), {})
				const valid = box('pssh', 32)
				const result = parse(concat(valid, new Uint8Array(length)))
				deepStrictEqual(toBytes(result[uuid]), valid)
			}
		})

		it('skips truncated PSSH boxes without reading the next box', () => {
			for (const length of [8, 12, 28, 31]) {
				deepStrictEqual(parse(box('pssh', length)), {})
				deepStrictEqual(parse(concat(box('pssh', length), box('free', 32))), {})
			}
		})

		it('rejects sizes outside the box boundaries', () => {
			for (const size of [2, 7, 33, 0xffffffff]) {
				deepStrictEqual(parse(box('pssh', 32, size)), {})
			}
		})

		it('reads extended sizes for PSSH and other boxes', () => {
			const free = box('free', 16, 1)
			new DataView(free.buffer).setUint32(12, 16)
			const pssh = box('pssh', 40, 1)
			new DataView(pssh.buffer).setUint32(12, 40)
			const result = parse(concat(free, pssh))
			deepStrictEqual(Object.keys(result), [uuid])
			deepStrictEqual(toBytes(result[uuid]), pssh)
		})

		it('rejects truncated and invalid extended headers', () => {
			for (const length of [8, 12, 15]) {
				deepStrictEqual(parse(box('free', length, 1)), {})
			}
			for (const size of [0, 8, 15, 17]) {
				const data = box('free', 16, 1)
				new DataView(data.buffer).setUint32(12, size)
				deepStrictEqual(parse(data), {})
			}
			const huge = box('pssh', 40, 1)
			new DataView(huge.buffer).setUint32(8, 0xffffffff)
			deepStrictEqual(parse(huge), {})
			const short = box('pssh', 39, 1)
			new DataView(short.buffer).setUint32(12, 39)
			deepStrictEqual(parse(short), {})
		})

		it('treats size zero as the remaining input', () => {
			deepStrictEqual(parse(box('free', 12, 0)), {})
			const pssh = box('pssh', 32, 0)
			deepStrictEqual(toBytes(parse(pssh)[uuid]), pssh)
			const valid = box('pssh', 32)
			deepStrictEqual(toBytes(parse(concat(valid, box('free', 12, 0)))[uuid]), valid)
			deepStrictEqual(toBytes(parse(concat(valid, box('pssh', 12, 0)))[uuid]), valid)
		})
	})
}
