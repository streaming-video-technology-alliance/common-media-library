import { deepStrictEqual, ok, strictEqual, throws } from 'node:assert'
import { describe, it } from 'node:test'
import { Tag } from 'cbor-x'
import { encode, Encoder } from 'cbor-x/encode'
import { CborTag, decodeCbor, readCborItem } from '../../src/cbor/readCborItem.ts'

const toBytes = (hex: string): Uint8Array => Uint8Array.from(Buffer.from(hex.replace(/ /g, ''), 'hex'))

// Plain CBOR as real signers emit it: no tag 64 on byte strings, and Maps encode as plain CBOR maps.
const PLAIN = new Encoder({ tagUint8Array: false, useRecords: false, mapsAsObjects: false })

describe('decodeCbor', () => {
	// #region example
	it('decodes a CBOR map', () => {
		const value = { keys: [{ a: 1, b: [2, 3], c: 'x' }], n: 5 }
		const bytes = Uint8Array.from(encode(value))

		deepStrictEqual(decodeCbor(bytes), value)
	})
	// #endregion example

	describe('integers', () => {
		it('decodes an unsigned integer up to 2^53 - 1 as a number', () => {
			strictEqual(decodeCbor(toBytes('00')), 0)
			strictEqual(decodeCbor(toBytes('17')), 23)
			strictEqual(decodeCbor(toBytes('18 18')), 24)
			strictEqual(decodeCbor(toBytes('19 03e8')), 1000)
			strictEqual(decodeCbor(toBytes('1a 000f4240')), 1000000)
			// 2^32: cbor-x returns a BigInt from here
			strictEqual(decodeCbor(toBytes('1b 0000000100000000')), 4294967296)
			strictEqual(decodeCbor(toBytes('1b 001fffffffffffff')), Number.MAX_SAFE_INTEGER)
		})

		it('decodes an unsigned integer of 2^53 or more as a BigInt', () => {
			strictEqual(decodeCbor(toBytes('1b 0020000000000000')), BigInt(2 ** 53))
			strictEqual(decodeCbor(toBytes('1b ffffffffffffffff')), BigInt('18446744073709551615'))
		})

		it('decodes a negative integer down to -(2^53 - 1) as a number', () => {
			strictEqual(decodeCbor(toBytes('20')), -1)
			strictEqual(decodeCbor(toBytes('38 63')), -100)
			strictEqual(decodeCbor(toBytes('3b 001ffffffffffffe')), Number.MIN_SAFE_INTEGER)
		})

		it('decodes a negative integer below -(2^53 - 1) as a BigInt', () => {
			strictEqual(decodeCbor(toBytes('3b 001fffffffffffff')), -BigInt(2 ** 53))
		})

		it('accepts a non-shortest integer encoding', () => {
			// 18 00: 0 in one extra byte. 1b 00..07: 7 in eight bytes, a BigInt in cbor-x.
			strictEqual(decodeCbor(toBytes('18 00')), 0)
			strictEqual(decodeCbor(toBytes('1b 0000000000000007')), 7)
		})
	})

	describe('strings', () => {
		it('decodes a byte string as a view of the input without a copy', () => {
			const bytes = toBytes('43 010203')
			const value = decodeCbor(bytes) as Uint8Array

			deepStrictEqual(value, Uint8Array.of(1, 2, 3))
			strictEqual(value.buffer, bytes.buffer)
			strictEqual(value.byteOffset, 1)
		})

		it('decodes a text string', () => {
			strictEqual(decodeCbor(toBytes('60')), '')
			strictEqual(decodeCbor(toBytes('63 616263')), 'abc')
			// f0 9f 98 80: U+1F600
			strictEqual(decodeCbor(toBytes('64 f09f9880')), '\u{1F600}')
		})

		it('decodes a long text string in ASCII and in UTF-8', () => {
			const ascii = 'a'.repeat(300)
			const utf8 = 'é'.repeat(300)
			strictEqual(decodeCbor(Uint8Array.from(PLAIN.encode(ascii))), ascii)
			strictEqual(decodeCbor(Uint8Array.from(PLAIN.encode(utf8))), utf8)
		})

		it('replaces invalid UTF-8 with U+FFFD', () => {
			strictEqual(decodeCbor(toBytes('61 ff')), '�')
		})

		it('rejects a byte string or a text string of indefinite length', () => {
			throws(() => decodeCbor(toBytes('5f 4101 ff')), RangeError)
			throws(() => decodeCbor(toBytes('7f 6161 ff')), RangeError)
		})
	})

	describe('arrays and maps', () => {
		it('decodes an array', () => {
			deepStrictEqual(decodeCbor(toBytes('80')), [])
			deepStrictEqual(decodeCbor(toBytes('83 01 02 03')), [1, 2, 3])
			deepStrictEqual(decodeCbor(toBytes('82 01 82 02 03')), [1, [2, 3]])
		})

		it('decodes a map with text keys to a plain object', () => {
			const value = decodeCbor(toBytes('a2 6161 01 6162 02')) as object

			deepStrictEqual(value, { a: 1, b: 2 })
			strictEqual(Object.getPrototypeOf(value), Object.prototype)
		})

		it('decodes a map with integer keys to a plain object with string keys', () => {
			// a2 01 02 20 01: {1: 2, -1: 1}, the shape of a COSE key
			deepStrictEqual(decodeCbor(toBytes('a2 01 02 20 01')), { 1: 2, '-1': 1 })
		})

		it('keeps the last value of a duplicate key', () => {
			deepStrictEqual(decodeCbor(toBytes('a2 6161 01 6161 02')), { a: 2 })
		})

		it('stores a __proto__ key as an own property and keeps the prototype', () => {
			// a1 69 5f5f70726f746f5f5f a1 6161 01: {"__proto__": {"a": 1}}
			const value = decodeCbor(toBytes('a1 69 5f5f70726f746f5f5f a1 6161 01')) as Record<string, unknown>

			ok(Object.prototype.hasOwnProperty.call(value, '__proto__'))
			deepStrictEqual(Object.getOwnPropertyDescriptor(value, '__proto__')?.value, { a: 1 })
			strictEqual(Object.getPrototypeOf(value), Object.prototype)
			strictEqual((value as { a?: unknown }).a, undefined)
		})

		it('names a boolean, null, or float key with String(key)', () => {
			deepStrictEqual(decodeCbor(toBytes('a1 f5 01')), { true: 1 })
			deepStrictEqual(decodeCbor(toBytes('a1 f6 01')), { null: 1 })
			deepStrictEqual(decodeCbor(toBytes('a1 f9 3e00 01')), { 1.5: 1 })
		})

		it('rejects a byte string, array, or map key', () => {
			throws(() => decodeCbor(toBytes('a1 41 01 02')), RangeError)
			throws(() => decodeCbor(toBytes('a1 80 02')), RangeError)
			throws(() => decodeCbor(toBytes('a1 a0 02')), RangeError)
		})

		it('decodes a map and an array of indefinite length', () => {
			// bf 6161 01 ff: map {a:1}. 9f 01 02 ff: array [1,2].
			deepStrictEqual(decodeCbor(toBytes('bf 6161 01 ff')), { a: 1 })
			deepStrictEqual(decodeCbor(toBytes('9f 01 02 ff')), [1, 2])
			deepStrictEqual(decodeCbor(toBytes('82 9f ff bf ff')), [[], {}])
		})

		it('rejects an indefinite map whose break falls in value position', () => {
			// bf 00 ff: indefinite map, key 0, then break before the value (malformed, RFC 8949 section 3.2.2).
			throws(() => decodeCbor(toBytes('bf 00 ff')), RangeError)
			throws(() => decodeCbor(toBytes('bf 00 ff 6161 01 ff')), RangeError)
		})

		it('rejects a stray break code', () => {
			throws(() => decodeCbor(toBytes('ff')), RangeError)
			throws(() => decodeCbor(toBytes('82 01 ff')), RangeError)
		})
	})

	describe('floats and simple values', () => {
		it('decodes half, single, and double precision floats', () => {
			strictEqual(decodeCbor(toBytes('f9 3e00')), 1.5)
			strictEqual(decodeCbor(toBytes('f9 7c00')), Infinity)
			strictEqual(decodeCbor(toBytes('f9 fc00')), -Infinity)
			ok(Number.isNaN(decodeCbor(toBytes('f9 7e00'))))
			// Smallest subnormal half float
			strictEqual(decodeCbor(toBytes('f9 0001')), 5.960464477539063e-8)
			ok(Object.is(decodeCbor(toBytes('f9 8000')), -0))
			strictEqual(decodeCbor(toBytes('fa 47c35000')), 100000)
			strictEqual(decodeCbor(toBytes('fb 3ff199999999999a')), 1.1)
		})

		it('decodes false, true, null, and undefined', () => {
			strictEqual(decodeCbor(toBytes('f4')), false)
			strictEqual(decodeCbor(toBytes('f5')), true)
			strictEqual(decodeCbor(toBytes('f6')), null)
			strictEqual(decodeCbor(toBytes('f7')), undefined)
		})

		it('rejects other simple values', () => {
			// f0: simple(16). f8 20: simple(32). f8 18: simple(24), not well-formed.
			throws(() => decodeCbor(toBytes('f0')), RangeError)
			throws(() => decodeCbor(toBytes('f8 20')), RangeError)
			throws(() => decodeCbor(toBytes('f8 18')), RangeError)
		})
	})

	describe('tags', () => {
		it('decodes tag 0 and tag 1 as a CborTag, not as a Date', () => {
			const dateTime = decodeCbor(toBytes('c0 74 323032352d30372d32395431303a30303a30305a'))
			ok(dateTime instanceof CborTag)
			strictEqual(dateTime.tag, 0)
			strictEqual(dateTime.value, '2025-07-29T10:00:00Z')

			const epoch = decodeCbor(toBytes('c1 1a 68889ca0'))
			ok(epoch instanceof CborTag)
			strictEqual(epoch.tag, 1)
			strictEqual(epoch.value, 1753783456)
		})

		it('decodes tag 64 around a byte string as a CborTag, not as the byte string', () => {
			const value = decodeCbor(toBytes('d8 40 43 010203'))

			ok(value instanceof CborTag)
			strictEqual(value.tag, 64)
			deepStrictEqual(value.value, Uint8Array.of(1, 2, 3))
		})

		it('decodes the tags that cbor-x converts to other types as a CborTag', () => {
			// c2 42 0100: bignum 256. d9 0102 80: set. d9 d9f7 00: self-described CBOR.
			for (const [hex, tag] of [['c2 42 0100', 2], ['d9 0102 80', 258], ['d9 d9f7 00', 55799]] as const) {
				const value = decodeCbor(toBytes(hex))
				ok(value instanceof CborTag, hex)
				strictEqual(value.tag, tag)
			}
		})

		it('decodes the tags that PR 508 rejected as a CborTag', () => {
			// Tags 28, 51, 259, and 0xdff9 and above drove their own reading in cbor-x.
			for (const [hex, tag] of [['d8 1c 80', 28], ['d8 33 80', 51], ['d9 0103 80', 259], ['d9 dff9 80', 0xdff9], ['d9 dffe 80', 0xdffe], ['d9 dfff 80', 0xdfff]] as const) {
				const value = decodeCbor(toBytes(hex))
				ok(value instanceof CborTag, hex)
				strictEqual(value.tag, tag)
				deepStrictEqual(value.value, [])
			}
		})

		it('keeps the bytes of a tagged COSE_Sign1 inside a map', () => {
			const coseSign1 = new Tag([toBytes('a10126'), new Map(), null, new Uint8Array(64)], 18)
			const tagBytes = Uint8Array.from(PLAIN.encode(coseSign1))
			const bytes = Uint8Array.from(PLAIN.encode({ key: 1, signerBinding: coseSign1, validityPeriod: 3600 }))

			const value = decodeCbor(bytes) as { signerBinding: CborTag }

			ok(value.signerBinding instanceof CborTag)
			strictEqual(value.signerBinding.tag, 18)
			deepStrictEqual(value.signerBinding.bytes, tagBytes)
			strictEqual(value.signerBinding.bytes.buffer, bytes.buffer)
		})

		it('rejects a tag number above 2^53 - 1', () => {
			throws(() => decodeCbor(toBytes('db ffffffffffffffff 00')), RangeError)
		})
	})

	describe('malformed input', () => {
		it('rejects an empty input', () => {
			throws(() => decodeCbor(new Uint8Array(0)), RangeError)
		})

		it('rejects an incomplete item', () => {
			// 82 01: array of 2 with one item. 43 0102: 3 bytes declared, 2 present. 19 03: 2-byte argument, 1 present.
			throws(() => decodeCbor(toBytes('82 01')), RangeError)
			throws(() => decodeCbor(toBytes('43 0102')), RangeError)
			throws(() => decodeCbor(toBytes('19 03')), RangeError)
			throws(() => decodeCbor(toBytes('a1 6161')), RangeError)
		})

		it('rejects additional information 28 to 30 and an indefinite integer or tag', () => {
			for (const hex of ['1c', '1d', '1e', 'fc', '3f', 'df']) {
				throws(() => decodeCbor(toBytes(hex)), RangeError, hex)
			}
		})

		it('rejects trailing bytes after the first data item', () => {
			// 01 01: two integers. The first item ends at offset 1, so the second is trailing.
			throws(() => decodeCbor(toBytes('01 01')), RangeError)
		})

		it('rejects a definite-length array header that declares more items than the bytes hold', () => {
			// 9a 06b9580f: array of 112810000 items, with no items. cbor-x fills the array before it checks the end.
			throws(() => decodeCbor(toBytes('9a 06b9580f')), RangeError)
			// a5 00: map of 5 pairs, with one key
			throws(() => decodeCbor(toBytes('a5 00')), RangeError)
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

		it('decodes 128 nested levels and rejects 129', () => {
			const nested = (levels: number): Uint8Array => Uint8Array.from([...Array(levels - 1).fill(0x81), 0x80])
			let value = decodeCbor(nested(128))
			for (let level = 1; level < 128; level++) value = (value as unknown[])[0]
			deepStrictEqual(value, [])

			throws(() => decodeCbor(nested(129)), RangeError)
		})
	})
})

describe('readCborItem', () => {
	it('returns the value and the offset after a complete data item', () => {
		const bytes = Uint8Array.from(encode({ a: 1 }))

		deepStrictEqual(readCborItem(bytes), { value: { a: 1 }, end: bytes.length })
	})

	it('stops at the end of the first item when trailing bytes follow', () => {
		// A merkle box pads multiple maps to a fixed size, so bytes after the first item are expected (section A.5.4.1.4).
		const item = Uint8Array.from(encode({ a: 1 }))
		const padded = new Uint8Array(item.length + 4)
		padded.set(item)

		deepStrictEqual(readCborItem(padded), { value: { a: 1 }, end: item.length })
	})

	it('reads a nested item from the given offset', () => {
		// 82 01 82 02 03: array [1, [2, 3]]. The second item starts at offset 2.
		deepStrictEqual(readCborItem(toBytes('82 01 82 02 03'), 2), { value: [2, 3], end: 5 })
	})

	it('throws when an item ends after the bytes', () => {
		// 82 01: array of 2 items with only one present
		throws(() => readCborItem(toBytes('82 01')), RangeError)
		throws(() => readCborItem(toBytes('01'), 1), RangeError)
	})
})
