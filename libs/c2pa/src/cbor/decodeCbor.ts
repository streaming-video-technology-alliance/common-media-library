import { decode } from 'cbor-x/decode'

const CBOR_BREAK = 0xff

/**
 * Returns the offset after the CBOR data item that starts at `offset` (RFC 8949 section 3).
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
	// RFC 8949 section 3.2: strings, arrays, and maps of indefinite length end with the break code
	if (additionalInfo === 31 && majorType > 1 && majorType < 6) {
		while (bytes[offset] !== CBOR_BREAK) offset = readCborItemEnd(bytes, offset)
		return offset + 1
	}
	if (additionalInfo > 27) throw new RangeError('Malformed CBOR data item')
	if (majorType === 2 || majorType === 3) offset += argument
	else if (majorType === 4 || majorType === 5 || majorType === 6) {
		for (let count = majorType === 5 ? 2 * argument : majorType === 6 ? 1 : argument; count--;) offset = readCborItemEnd(bytes, offset)
	}
	if (!(offset <= bytes.length)) throw new RangeError('Incomplete CBOR data item')
	return offset
}

/**
 * Decodes CBOR bytes with cbor-x after a check that the data item is complete.
 *
 * cbor-x allocates and fills the declared length of an array before it checks the end of the bytes.
 * The check bounds that work by the length of the bytes.
 *
 * @param bytes - CBOR bytes of one data item
 * @returns The decoded value
 * @throws If the data item is malformed or incomplete
 *
 * @internal
 */
export function decodeCbor(bytes: Uint8Array): unknown {
	readCborItemEnd(bytes)
	return decode(bytes)
}
