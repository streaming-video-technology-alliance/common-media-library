import { deepStrictEqual, strictEqual, throws } from 'node:assert'
import { describe, it } from 'node:test'
import { encode } from 'cbor-x/encode'
import { decodeCbor, readCborItemEnd } from '../../src/cbor/decodeCbor.ts'

const toBytes = (hex: string): Uint8Array => Uint8Array.from(Buffer.from(hex, 'hex'))

describe('decodeCbor', () => {
	// #region example
	it('decodes a CBOR map to the same value as the decoder', () => {
		const value = { keys: [{ a: 1, b: [2, 3], c: 'x' }], n: 5 }
		const bytes = Uint8Array.from(encode(value))

		deepStrictEqual(decodeCbor(bytes), value)
	})
	// #endregion example

	it('decodes a map and an array of indefinite length', () => {
		// bf 6161 01 ff: map {a:1}. 9f 01 02 ff: array [1,2].
		deepStrictEqual(decodeCbor(toBytes('bf616101ff')), { a: 1 } as unknown)
		deepStrictEqual(decodeCbor(toBytes('9f0102ff')), [1, 2])
	})

	it('rejects a definite-length array header that declares more items than the bytes hold', () => {
		// 9a 06b9580f: array of 112810000 items, with no items. cbor-x fills the array before it checks the end.
		throws(() => decodeCbor(toBytes('9a06b9580f')), RangeError)
	})

	it('rejects nested array headers that each declare the remaining bytes', () => {
		// Each 0x9a header declares a uint32 count equal to the bytes left after it, so cbor-x preallocates at every level.
		const size = 200
		const bytes = new Uint8Array(size)
		const view = new DataView(bytes.buffer)
		for (let offset = 0; offset + 5 <= size; offset += 5) {
			bytes[offset] = 0x9a
			view.setUint32(offset + 1, size - (offset + 5), false)
		}
		throws(() => decodeCbor(bytes), RangeError)
	})

	it('rejects an empty input', () => {
		throws(() => decodeCbor(new Uint8Array(0)), RangeError)
	})
})

describe('readCborItemEnd', () => {
	it('returns the offset after a complete data item', () => {
		const bytes = Uint8Array.from(encode({ a: 1 }))

		strictEqual(readCborItemEnd(bytes), bytes.length)
	})

	it('stops at the end of the first item when trailing bytes follow', () => {
		// A merkle box pads multiple maps to a fixed size, so bytes after the first item are expected (section A.5.4.1.4).
		const item = Uint8Array.from(encode({ a: 1 }))
		const padded = new Uint8Array(item.length + 4)
		padded.set(item)

		strictEqual(readCborItemEnd(padded), item.length)
	})

	it('reads a nested item from the given offset', () => {
		// 82 01 820203: array [1, [2, 3]]. The second item starts at offset 2.
		strictEqual(readCborItemEnd(toBytes('82018202 03'.replace(/ /g, '')), 2), 5)
	})

	it('throws when an item ends after the bytes', () => {
		// 82 01: array of 2 items with only one present
		throws(() => readCborItemEnd(toBytes('8201')), RangeError)
	})
})
