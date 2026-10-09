// ignoreBOM keeps a leading U+FEFF, which the default TextDecoder removes (WHATWG Encoding, TextDecoder)
const TEXT_DECODER = /* @__PURE__ */ new TextDecoder('utf-8', { ignoreBOM: true })

const MAJOR_UINT = 0
const MAJOR_NEGINT = 1
const MAJOR_BYTES = 2
const MAJOR_TEXT = 3
const MAJOR_ARRAY = 4
const MAJOR_MAP = 5
const MAJOR_SIMPLE = 7
const INFO_INDEFINITE = 31
const INDEFINITE_COUNT = -1
const BREAK = 0xff
const SIMPLE_FALSE = 20
const SIMPLE_TRUE = 21
const SIMPLE_NULL = 22
const SIMPLE_UNDEFINED = 23
const INFO_HALF_FLOAT = 25
const INFO_SINGLE_FLOAT = 26
const INFO_DOUBLE_FLOAT = 27
const MAX_NESTING_DEPTH = 128
const ASCII_FAST_PATH_MAX_LENGTH = 32
// A 64-bit argument is a safe integer when its high 32 bits are below 2^21
const MAX_SAFE_HIGH_WORD = 0x200000
const TWO_POW_32 = 0x100000000

/**
 * A CBOR tag (RFC 8949 section 3.4) with the bytes of the whole tagged item.
 *
 * A class keeps a tag distinct from a CBOR map with `tag` and `value` keys.
 *
 * @internal
 */
export class CborTag {
	readonly tag: number
	readonly value: unknown
	/** The tagged item, header and content, as a view of the input */
	readonly bytes: Uint8Array

	constructor(tag: number, value: unknown, bytes: Uint8Array) {
		this.tag = tag
		this.value = value
		this.bytes = bytes
	}
}

/**
 * A decoded CBOR data item and the offset after its last byte.
 *
 * @internal
 */
export type CborItem = {
	readonly value: unknown
	readonly end: number
}

type Reader = {
	readonly bytes: Uint8Array
	offset: number
	depth: number
}

function malformed(): RangeError {
	return new RangeError('Malformed CBOR data item')
}

function incomplete(): RangeError {
	return new RangeError('Incomplete CBOR data item')
}

function readUint32(bytes: Uint8Array, offset: number): number {
	return ((bytes[offset] << 24) >>> 0) + ((bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3])
}

function readArgument(reader: Reader, info: number): number | bigint {
	if (info < 24) return info
	if (info > INFO_DOUBLE_FLOAT) throw malformed()
	const size = 1 << (info - 24)
	const { bytes } = reader
	const start = reader.offset
	if (start + size > bytes.length) throw incomplete()
	reader.offset = start + size
	if (size === 1) return bytes[start]
	if (size === 2) return (bytes[start] << 8) | bytes[start + 1]
	if (size === 4) return readUint32(bytes, start)
	const high = readUint32(bytes, start)
	const low = readUint32(bytes, start + 4)
	if (high < MAX_SAFE_HIGH_WORD) return high * TWO_POW_32 + low
	return BigInt(high) * BigInt(TWO_POW_32) + BigInt(low)
}

function halfFloatToNumber(half: number): number {
	const sign = half & 0x8000 ? -1 : 1
	const exponent = (half >> 10) & 0x1f
	const fraction = half & 0x3ff
	if (exponent === 0) return sign * fraction * 2 ** -24
	if (exponent === 0x1f) return fraction ? NaN : sign * Infinity
	return sign * (1 + fraction / 1024) * 2 ** (exponent - 15)
}

function readSimple(reader: Reader, info: number): unknown {
	if (info < 24) {
		if (info === SIMPLE_FALSE) return false
		if (info === SIMPLE_TRUE) return true
		if (info === SIMPLE_NULL) return null
		if (info === SIMPLE_UNDEFINED) return undefined
		throw malformed()
	}
	if (info < INFO_HALF_FLOAT || info > INFO_DOUBLE_FLOAT) throw malformed()
	const size = 1 << (info - 24)
	const { bytes } = reader
	const start = reader.offset
	if (start + size > bytes.length) throw incomplete()
	reader.offset = start + size
	if (info === INFO_HALF_FLOAT) return halfFloatToNumber((bytes[start] << 8) | bytes[start + 1])
	const view = new DataView(bytes.buffer, bytes.byteOffset + start, size)
	return info === INFO_SINGLE_FLOAT ? view.getFloat32(0) : view.getFloat64(0)
}

function readBytes(reader: Reader, length: number | bigint): Uint8Array {
	const { bytes } = reader
	const start = reader.offset
	if (typeof length !== 'number' || length > bytes.length - start) throw incomplete()
	reader.offset = start + length
	return bytes.subarray(start, reader.offset)
}

function readText(view: Uint8Array): string {
	if (view.length > ASCII_FAST_PATH_MAX_LENGTH) return TEXT_DECODER.decode(view)
	let text = ''
	for (const byte of view) {
		if (byte > 127) return TEXT_DECODER.decode(view)
		text += String.fromCharCode(byte)
	}
	return text
}

function enter(reader: Reader): void {
	if (++reader.depth > MAX_NESTING_DEPTH) throw new RangeError('CBOR nesting deeper than 128 levels')
}

// Consumes the break code of an indefinite-length container (RFC 8949 section 3.2.2)
function atBreak(reader: Reader): boolean {
	if (reader.offset >= reader.bytes.length) throw incomplete()
	if (reader.bytes[reader.offset] !== BREAK) return false
	reader.offset++
	return true
}

function readArray(reader: Reader, count: number | bigint): unknown[] {
	enter(reader)
	const items: unknown[] = []
	if (count === INDEFINITE_COUNT) {
		while (!atBreak(reader)) items.push(readItem(reader))
	} else {
		if (typeof count !== 'number' || count > reader.bytes.length - reader.offset) throw incomplete()
		for (let i = 0; i < count; i++) items.push(readItem(reader))
	}
	reader.depth--
	return items
}

function setEntry(map: Record<string, unknown>, key: unknown, value: unknown): void {
	if (key !== null && typeof key === 'object') throw new RangeError('Unsupported CBOR map key')
	const name = String(key)
	if (name === '__proto__') Object.defineProperty(map, name, { value, enumerable: true, writable: true, configurable: true })
	else map[name] = value
}

function readMap(reader: Reader, count: number | bigint): Record<string, unknown> {
	enter(reader)
	const map: Record<string, unknown> = {}
	if (count === INDEFINITE_COUNT) {
		while (!atBreak(reader)) setEntry(map, readItem(reader), readItem(reader))
	} else {
		if (typeof count !== 'number' || count * 2 > reader.bytes.length - reader.offset) throw incomplete()
		for (let i = 0; i < count; i++) setEntry(map, readItem(reader), readItem(reader))
	}
	reader.depth--
	return map
}

function readTag(reader: Reader, tag: number | bigint, start: number): CborTag {
	if (typeof tag !== 'number') throw malformed()
	enter(reader)
	const value = readItem(reader)
	reader.depth--
	return new CborTag(tag, value, reader.bytes.subarray(start, reader.offset))
}

function readItem(reader: Reader): unknown {
	const { bytes } = reader
	const start = reader.offset
	if (start >= bytes.length) throw incomplete()
	const initialByte = bytes[start]
	reader.offset = start + 1
	const majorType = initialByte >> 5
	const info = initialByte & 31
	if (majorType === MAJOR_SIMPLE) return readSimple(reader, info)
	if (info === INFO_INDEFINITE) {
		if (majorType === MAJOR_ARRAY) return readArray(reader, INDEFINITE_COUNT)
		if (majorType === MAJOR_MAP) return readMap(reader, INDEFINITE_COUNT)
		throw malformed()
	}
	const argument = readArgument(reader, info)
	switch (majorType) {
		case MAJOR_UINT: return argument
		case MAJOR_NEGINT: return typeof argument === 'number' && argument < Number.MAX_SAFE_INTEGER ? -1 - argument : BigInt(-1) - BigInt(argument)
		case MAJOR_BYTES: return readBytes(reader, argument)
		case MAJOR_TEXT: return readText(readBytes(reader, argument))
		case MAJOR_ARRAY: return readArray(reader, argument)
		case MAJOR_MAP: return readMap(reader, argument)
		default: return readTag(reader, argument, start)
	}
}

/**
 * Reads the CBOR data item that starts at `offset` (RFC 8949 section 3).
 *
 * Integers with a magnitude up to `Number.MAX_SAFE_INTEGER` are numbers, larger ones are BigInts.
 * Byte strings are views of the input. Maps are plain objects with string keys. Every tag is a
 * {@link CborTag}. The work and the memory are bounded by the length of the input: no container is
 * allocated from a declared length, and the nesting of arrays, maps, and tags stops at 128 levels.
 *
 * @param bytes - CBOR bytes
 * @param offset - Offset of the first byte of the data item
 * @returns The decoded value and the offset after the last byte of the data item
 * @throws RangeError If the data item is malformed, incomplete, or nested too deep
 *
 * @internal
 */
export function readCborItem(bytes: Uint8Array, offset: number = 0): CborItem {
	const reader: Reader = { bytes, offset, depth: 0 }
	const value = readItem(reader)
	return { value, end: reader.offset }
}

/**
 * Decodes CBOR bytes that hold exactly one data item.
 *
 * @param bytes - CBOR bytes of one data item
 * @returns The decoded value, see {@link readCborItem}
 * @throws RangeError If the data item is malformed, incomplete, nested too deep, or followed by trailing bytes
 *
 * @internal
 */
export function decodeCbor(bytes: Uint8Array): unknown {
	const item = readCborItem(bytes)
	if (item.end !== bytes.length) throw new RangeError('Trailing bytes after CBOR data item')
	return item.value
}
