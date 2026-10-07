import { deepStrictEqual, ok, strictEqual, throws } from 'node:assert'
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

	it('rejects an indefinite map whose break falls in value position', () => {
		// bf 00 ff: indefinite map, key 0, then break before the value (malformed, RFC 8949 section 3.2.2).
		// cbor-x reads it differently, so the walk and the decoder disagree on the item boundary.
		throws(() => decodeCbor(toBytes('bf00ff')), RangeError)
		throws(() => decodeCbor(toBytes('bf00ff616101ff')), RangeError)
	})

	it('rejects trailing bytes after the first data item', () => {
		// 01 01: two integers. The first item ends at offset 1, so the second is trailing.
		throws(() => decodeCbor(toBytes('0101')), RangeError)
	})

	it('rejects a cbor-x record or bundled-string tag', () => {
		// cbor-x reads tags 0xdff9, 0xdffe, and 0xdfff with record semantics, not as a plain tagged item.
		throws(() => decodeCbor(toBytes('d9dfff80')), RangeError)
		throws(() => decodeCbor(toBytes('d9dff980')), RangeError)
		throws(() => decodeCbor(toBytes('d9dffe80')), RangeError)
	})

	it('rejects a cbor-x packed, shared-value, or set-with-read tag', () => {
		// Tags 28, 51, and 259 drive their own reading in cbor-x (handlesRead), so a plain walk cannot bound them.
		throws(() => decodeCbor(toBytes('d81c80')), RangeError)
		throws(() => decodeCbor(toBytes('d83380')), RangeError)
		throws(() => decodeCbor(toBytes('d9010380')), RangeError)
	})

	it('decodes an allowed tag as a tagged value', () => {
		// Tag 0 (date-time) is not a cbor-x divergent-read tag, so the walk accepts it and the decoder returns a Date.
		const value = decodeCbor(toBytes('c074323032352d30372d32395431303a30303a30305a'))
		ok(value instanceof Date)
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
