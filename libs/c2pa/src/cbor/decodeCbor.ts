import { decode } from 'cbor-x/decode'

const CBOR_BREAK = 0xff
const MAJOR_BYTE_STRING = 2
const MAJOR_ARRAY = 4
const MAJOR_MAP = 5
const MAJOR_TAG = 6

// cbor-x reads these tags with its own logic instead of as a plain tagged item (RFC 8949 section 3.4), so a plain
// walk cannot bound the bytes they consume. Tags 28, 51, and 259 drive their own reading. Every tag at or above
// 0xdff9 enters the record and bundled-string path. No interoperable C2PA producer emits these tags.
function isReservedCborTag(tag: number): boolean {
	return tag === 28 || tag === 51 || tag === 259 || tag >= 0xdff9
}

/**
 * Returns the offset after the CBOR data item that starts at `offset` (RFC 8949 section 3).
 *
 * The walk matches how cbor-x decodes the bytes. It rejects an item that cbor-x would read with a different length,
 * so a later call to `decode` on the same bytes cannot reach an allocation that the walk did not account for.
 *
 * @param bytes - CBOR bytes
 * @param offset - Offset of the first byte of the data item
 * @returns The offset after the last byte of the data item
 * @throws If the data item is malformed or ends after the bytes
 *
 * @internal
 */
export function readCborItemEnd(bytes: Uint8Array, offset: number = 0): number {
	const initialByte = bytes[offset++]
	const majorType = initialByte >> 5
	const additionalInfo = initialByte & 31
	let argument = additionalInfo
	if (additionalInfo > 23 && additionalInfo < 28) {
		let size = 1 << (additionalInfo - 24)
		for (argument = 0; size--;) argument = argument * 256 + bytes[offset++]
	}
	if (!(offset <= bytes.length)) throw new RangeError('Incomplete CBOR data item')
	// RFC 8949 section 3.2.2: only arrays and maps may be indefinite, and each ends with the break code.
	// cbor-x rejects an indefinite byte or text string, so reject every other indefinite major type here.
	if (additionalInfo === 31) {
		if (majorType !== MAJOR_ARRAY && majorType !== MAJOR_MAP) throw new RangeError('Malformed CBOR data item')
		let count = 0
		while (bytes[offset] !== CBOR_BREAK) {
			if (!(offset < bytes.length)) throw new RangeError('Incomplete CBOR data item')
			offset = readCborItemEnd(bytes, offset)
			count++
		}
		// A map is a sequence of key and value pairs, so a break in value position is malformed.
		if (majorType === MAJOR_MAP && count % 2 !== 0) throw new RangeError('Malformed CBOR data item')
		return offset + 1
	}
	if (additionalInfo > 27) throw new RangeError('Malformed CBOR data item')
	if (majorType === MAJOR_TAG && isReservedCborTag(argument)) throw new RangeError('Unsupported CBOR tag')
	if (majorType === MAJOR_BYTE_STRING || majorType === 3) offset += argument
	else if (majorType === MAJOR_ARRAY || majorType === MAJOR_MAP || majorType === MAJOR_TAG) {
		for (let count = majorType === MAJOR_MAP ? 2 * argument : majorType === MAJOR_TAG ? 1 : argument; count--;) offset = readCborItemEnd(bytes, offset)
	}
	if (!(offset <= bytes.length)) throw new RangeError('Incomplete CBOR data item')
	return offset
}

/**
 * Decodes CBOR bytes with cbor-x after a check that the data item is complete.
 *
 * cbor-x allocates and fills the declared length of an array before it checks the end of the bytes.
 * The check bounds that work by the length of the bytes. It also requires the item to span every byte,
 * so trailing bytes cannot reach the decoder.
 *
 * @param bytes - CBOR bytes of one data item
 * @returns The decoded value
 * @throws If the data item is malformed, incomplete, or followed by trailing bytes
 *
 * @internal
 */
export function decodeCbor(bytes: Uint8Array): unknown {
	if (readCborItemEnd(bytes) !== bytes.length) throw new RangeError('Trailing bytes after CBOR data item')
	return decode(bytes)
}
