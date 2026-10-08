import { deepStrictEqual, ok, strictEqual, throws } from 'node:assert'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { Tag } from 'cbor-x'
import { decodeCbor as decodeWithCborX } from '../../src/cbor/decodeCbor.ts'
import { projectCborTags } from '../../src/cbor/projectCborTags.ts'
import { CborTag, decodeCbor } from '../../src/cbor/readCborItem.ts'
import { readC2paManifest } from '../../src/readC2paManifest.ts'

const toBytes = (hex: string): Uint8Array => Uint8Array.from(Buffer.from(hex.replace(/ /g, ''), 'hex'))
const loadFixture = (name: string): Uint8Array => new Uint8Array(readFileSync(new URL(`../fixtures/${name}`, import.meta.url)))
const nestedArrays = (levels: number): Uint8Array => Uint8Array.from([...Array(levels - 1).fill(0x81), 0x80])

const MAX_SAFE_INTEGER = BigInt(Number.MAX_SAFE_INTEGER)

// CBOR items per fixture: the claim, the signature, the CBOR assertions, and the byte strings inside them that are CBOR
const FIXTURES = [
	{ name: 'init_signed_with_session_keys.m4s', items: 6 },
	{ name: 'test-segment.m4s', items: 6 },
	{ name: 'vsi_init_with_signer_binding.mp4', items: 7 },
]

// Inputs that both decoders accept with the same value
const SAME_VALUE = [
	// unsigned integers
	'00', '17', '18 18', '19 0100', '1a ffffffff', '1b 0000000100000000', '1b 001fffffffffffff', '1b 0020000000000000', '1b ffffffffffffffff',
	// negative integers
	'20', '38 18', '3b 001fffffffffffff', '3b 0020000000000000', '3b ffffffffffffffff',
	// byte and text strings, with a text string above the ASCII fast path of the reader
	'40', '42 0102', '60', '63 616263', '62 ffff', '78 28 ' + '61'.repeat(40), 'a1 62 c3a9 01',
	// arrays and maps, with integer, float, boolean, and null keys, and a duplicate key
	'80', '84 f4 f5 f6 f7', '9f 01 02 ff', 'a0', 'a2 01 02 03 04', 'a1 20 02', 'a2 61 61 01 61 61 02', 'a1 f9 3e00 02', 'a1 f5 02', 'a1 f6 02', 'bf 61 61 01 ff',
	// floats, with a subnormal half float, negative zero, NaN, and Infinity
	'f9 3e00', 'f9 0001', 'f9 8000', 'f9 7e00', 'fa 3fc00000', 'fa 7f800000', 'fb 3ff8000000000000',
	// tag 0 with text and tag 1 with an integer or a float
	'c0 74 323032352d30372d32395431303a30303a30305a', '81 c0 74 323032352d30372d32395431303a30303a30305a', 'c1 1a 5f5e0ff0', 'c1 fb 41d7c2a35b8ccccd',
	// tag 18 around a COSE_Sign1 array, tag 24, tag 32, and tag 999
	'd2 84 40 a0 f6 40', 'd8 18 42 0102', 'd8 20 61 61', 'd9 03e7 01',
]

// Inputs that both decoders reject
const BOTH_REJECT = [
	// empty and incomplete items
	'', '82 01', '43 0102', '19 03', 'a1 6161', '9a 06b9580f', 'a5 00',
	// additional information 28 to 30, an indefinite integer, negative integer, or tag, and a break outside a container
	'1c', '1d', '1e', 'fc', '3f', 'df', 'ff', '82 01 ff', 'bf 00 ff',
	// indefinite strings, trailing bytes, reserved simple values, container keys, and a tag number above 2^53 - 1
	'5f 41 01 41 02 ff', '7f 61 61 61 62 ff', '01 01', 'f0', 'f8 18', 'f8 20', 'a1 41 01 02', 'a1 80 02', 'db ffffffffffffffff 01',
]

// The cbor-x value in the public shape of the reader. A BigInt up to 2^53 - 1 becomes a number. A Tag becomes { tag, value }.
function normalize(value: unknown): unknown {
	if (typeof value === 'bigint') return value >= -MAX_SAFE_INTEGER && value <= MAX_SAFE_INTEGER ? Number(value) : value
	if (value instanceof Tag) return { tag: value.tag, value: normalize(value.value) }
	if (Array.isArray(value)) return value.map(normalize)
	if (value === null || typeof value !== 'object' || value instanceof Uint8Array || value instanceof Date) return value
	return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalize(entry)]))
}

type Decoded = { readonly accepted: true; readonly value: unknown } | { readonly accepted: false }

// Decodes `bytes` with both decoders. Both accept or both reject, and the accepted values are equal.
function decodeWithBoth(bytes: Uint8Array, path: string): Decoded {
	let fromCborX: unknown
	let fromReader: unknown
	let cborXAccepts = true
	let readerAccepts = true
	try { fromCborX = decodeWithCborX(bytes) } catch { cborXAccepts = false }
	try { fromReader = decodeCbor(bytes) } catch { readerAccepts = false }
	strictEqual(readerAccepts, cborXAccepts, `${path}: the reader ${readerAccepts ? 'accepts' : 'rejects'}, cbor-x ${cborXAccepts ? 'accepts' : 'rejects'}`)
	if (!readerAccepts) return { accepted: false }
	deepStrictEqual(projectCborTags(fromReader), normalize(fromCborX), path)
	return { accepted: true, value: fromReader }
}

// Compares the byte strings inside `value` that both decoders accept as CBOR. Returns the number of compared items.
function compareNested(value: unknown, path: string): number {
	if (value instanceof Uint8Array) {
		const nested = decodeWithBoth(value, `${path}/bstr`)
		return nested.accepted ? 1 + compareNested(nested.value, `${path}/bstr`) : 0
	}
	if (value instanceof CborTag) return compareNested(value.value, `${path}/tag${value.tag}`)
	if (Array.isArray(value)) return value.reduce<number>((count, item, index) => count + compareNested(item, `${path}[${index}]`), 0)
	if (value !== null && typeof value === 'object') {
		return Object.entries(value).reduce<number>((count, [key, item]) => count + compareNested(item, `${path}.${key}`), 0)
	}
	return 0
}

describe('projectCborTags', () => {
	// #region example
	it('projects tag 0 to a Date and every other tag to a plain object', () => {
		// a2 61 74 c0 74 ...: { t: 0("2025-07-29T10:00:00Z"), u: 32("a") }
		const tree = decodeCbor(toBytes('a2 61 74 c0 74 323032352d30372d32395431303a30303a30305a 61 75 d8 20 61 61'))

		deepStrictEqual(projectCborTags(tree), { t: new Date('2025-07-29T10:00:00Z'), u: { tag: 32, value: 'a' } })
	})
	// #endregion example

	it('projects tag 1 to a Date rounded to the millisecond', () => {
		// c1 fb 41d7c2a35b8ccccd: 1(1594527086.2)
		deepStrictEqual(projectCborTags(decodeCbor(toBytes('c1 fb 41d7c2a35b8ccccd'))), new Date(1594527086200))
	})

	it('copies arrays and maps and keeps byte strings as views of the input', () => {
		// 82 a1 61 61 42 0102 80: [{ a: h'0102' }, []]
		const tree = decodeCbor(toBytes('82 a1 61 61 42 0102 80')) as [{ a: Uint8Array }, unknown[]]
		const projected = projectCborTags(tree) as [{ a: Uint8Array }, unknown[]]

		deepStrictEqual(projected, tree)
		ok(projected !== tree)
		ok(projected[0] !== tree[0])
		ok(projected[1] !== tree[1])
		strictEqual(projected[0].a, tree[0].a)
	})

	it('keeps a __proto__ key as an own property', () => {
		// a1 69 5f5f70726f746f5f5f 01: { "__proto__": 1 }
		const projected = projectCborTags(decodeCbor(toBytes('a1 69 5f5f70726f746f5f5f 01'))) as Record<string, unknown>

		deepStrictEqual(Object.keys(projected), ['__proto__'])
		strictEqual(Object.getPrototypeOf(projected), Object.prototype)
	})
})

describe('readCborItem equivalence with cbor-x', () => {
	for (const { name, items } of FIXTURES) {
		it(`decodes every CBOR item of ${name} like cbor-x`, (t) => {
			const manifest = readC2paManifest(loadFixture(name))
			ok(manifest.claimCborBytes, 'claim box')
			ok(manifest.signatureBytes, 'signature box')
			const boxes: readonly (readonly [string, Uint8Array])[] = [
				['claim', manifest.claimCborBytes],
				['signature', manifest.signatureBytes],
				...manifest.assertions.flatMap(assertion => assertion.cborBytes ? [[assertion.label, assertion.cborBytes] as const] : []),
			]

			let count = 0
			for (const [label, bytes] of boxes) {
				const path = `${name}/${label}`
				const decoded = decodeWithBoth(bytes, path)
				ok(decoded.accepted, `${path} decodes`)
				count += 1 + compareNested(decoded.value, path)
			}

			t.diagnostic(`${count} CBOR items`)
			strictEqual(count, items)
		})
	}

	it('decodes the value model cases like cbor-x', () => {
		for (const hex of SAME_VALUE) ok(decodeWithBoth(toBytes(hex), hex).accepted, hex)
	})

	it('rejects the malformed inputs of the reader tests like cbor-x', () => {
		for (const hex of BOTH_REJECT) ok(!decodeWithBoth(toBytes(hex), hex).accepted, hex)

		// Each 0x9a header declares a uint32 count equal to the bytes left after it
		const size = 200
		const headers = new Uint8Array(size)
		const view = new DataView(headers.buffer)
		for (let offset = 0; offset + 5 <= size; offset += 5) {
			headers[offset] = 0x9a
			view.setUint32(offset + 1, size - (offset + 5), false)
		}
		ok(!decodeWithBoth(headers, 'nested headers').accepted)
	})

	it('differs from cbor-x only in the cases of the design', () => {
		// d8 40 43 010203: tag 64 around a byte string. cbor-x returns the byte string.
		deepStrictEqual(projectCborTags(decodeCbor(toBytes('d8 40 43 010203'))), { tag: 64, value: Uint8Array.of(1, 2, 3) })
		deepStrictEqual(decodeWithCborX(toBytes('d8 40 43 010203')), Uint8Array.of(1, 2, 3))

		// c0 01 and c1 61 61: tag 0 or tag 1 with other content. cbor-x returns a Date with a wrong time.
		deepStrictEqual(projectCborTags(decodeCbor(toBytes('c0 01'))), { tag: 0, value: 1 })
		deepStrictEqual(decodeWithCborX(toBytes('c0 01')), new Date(1))
		deepStrictEqual(projectCborTags(decodeCbor(toBytes('c1 61 61'))), { tag: 1, value: 'a' })
		ok(Number.isNaN((decodeWithCborX(toBytes('c1 61 61')) as Date).getTime()))

		// c2 49 01 00..00, d8 41 42 0102, d9 0102 82 01 02, d9 d9f7 01: tags 2, 65, 258, and 55799.
		// cbor-x returns a BigInt, a Uint16Array, a Set, and the content.
		deepStrictEqual(projectCborTags(decodeCbor(toBytes('c2 49 010000000000000000'))), { tag: 2, value: toBytes('010000000000000000') })
		strictEqual(decodeWithCborX(toBytes('c2 49 010000000000000000')), BigInt(2) ** BigInt(64))
		deepStrictEqual(projectCborTags(decodeCbor(toBytes('d8 41 42 0102'))), { tag: 65, value: Uint8Array.of(1, 2) })
		ok(decodeWithCborX(toBytes('d8 41 42 0102')) instanceof Uint16Array)
		deepStrictEqual(projectCborTags(decodeCbor(toBytes('d9 0102 82 01 02'))), { tag: 258, value: [1, 2] })
		deepStrictEqual(decodeWithCborX(toBytes('d9 0102 82 01 02')), new Set([1, 2]))
		deepStrictEqual(projectCborTags(decodeCbor(toBytes('d9 d9f7 01'))), { tag: 55799, value: 1 })
		strictEqual(decodeWithCborX(toBytes('d9 d9f7 01')), 1)

		// d8 1c 80, d8 33 80, d9 0103 80, d9 dff9 80: tags 28, 51, 259, and 0xdff9. cbor-x rejects them.
		for (const [hex, tag] of [['d8 1c 80', 28], ['d8 33 80', 51], ['d9 0103 80', 259], ['d9 dff9 80', 0xdff9]] as const) {
			deepStrictEqual(projectCborTags(decodeCbor(toBytes(hex))), { tag, value: [] }, hex)
			throws(() => decodeWithCborX(toBytes(hex)), RangeError, hex)
		}

		// a1 69 5f5f70726f746f5f5f 01: the key __proto__. cbor-x renames the key to __proto_.
		deepStrictEqual(Object.keys(decodeCbor(toBytes('a1 69 5f5f70726f746f5f5f 01')) as object), ['__proto__'])
		deepStrictEqual(Object.keys(decodeWithCborX(toBytes('a1 69 5f5f70726f746f5f5f 01')) as object), ['__proto_'])

		// 129 nested arrays. cbor-x decodes them.
		throws(() => decodeCbor(nestedArrays(129)), RangeError)
		ok(Array.isArray(decodeWithCborX(nestedArrays(129))))
	})
})
