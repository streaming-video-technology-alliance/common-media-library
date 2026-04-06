import { parseJumbfBoxes } from '../../src/jumbf/parseJumbfBoxes.ts'
import { deepStrictEqual, strictEqual } from 'node:assert'
import { describe, it } from 'node:test'

function buildBox(type: string, payload: Uint8Array): Uint8Array {
	const size = 8 + payload.length
	const box = new Uint8Array(size)
	box[0] = (size >> 24) & 0xff
	box[1] = (size >> 16) & 0xff
	box[2] = (size >> 8) & 0xff
	box[3] = size & 0xff
	box.set(new TextEncoder().encode(type), 4)
	box.set(payload, 8)
	return box
}

function concat(...arrays: Uint8Array[]): Uint8Array {
	const total = arrays.reduce((sum, a) => sum + a.length, 0)
	const result = new Uint8Array(total)
	let offset = 0
	for (const a of arrays) {
		result.set(a, offset)
		offset += a.length
	}
	return result
}

describe('parseJumbfBoxes', () => {
	// #region example
	it('parses a single JUMBF box', () => {
		const payload = new Uint8Array([0x01, 0x02, 0x03])
		const bytes = buildBox('jumd', payload)
		const boxes = parseJumbfBoxes(bytes)

		strictEqual(boxes.length, 1)
		strictEqual(boxes[0].type, 'jumd')
		deepStrictEqual(boxes[0].data, payload)
	})
	// #endregion example

	it('parses multiple consecutive boxes', () => {
		const payload1 = new Uint8Array([0xaa, 0xbb])
		const payload2 = new Uint8Array([0xcc, 0xdd, 0xee])
		const bytes = concat(buildBox('jumd', payload1), buildBox('jP  ', payload2))
		const boxes = parseJumbfBoxes(bytes)

		strictEqual(boxes.length, 2)
		strictEqual(boxes[0].type, 'jumd')
		deepStrictEqual(boxes[0].data, payload1)
		strictEqual(boxes[1].type, 'jP  ')
		deepStrictEqual(boxes[1].data, payload2)
	})

	it('returns an empty array for empty input', () => {
		const boxes = parseJumbfBoxes(new Uint8Array(0))
		strictEqual(boxes.length, 0)
	})

	it('parses a box with no payload', () => {
		const bytes = buildBox('jumd', new Uint8Array(0))
		const boxes = parseJumbfBoxes(bytes)

		strictEqual(boxes.length, 1)
		strictEqual(boxes[0].type, 'jumd')
		strictEqual(boxes[0].data.length, 0)
	})
})
