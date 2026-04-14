/**
 * Minimal ASN.1 DER parsing helpers for X.509 certificate navigation.
 *
 * @internal
 */

export const ASN1_TAG_INTEGER = 0x02
export const ASN1_TAG_OBJECT_IDENTIFIER = 0x06
export const ASN1_TAG_SEQUENCE = 0x30
export const ASN1_TAG_SET = 0x31
export const ASN1_TAG_UTC_TIME = 0x17
export const ASN1_TAG_GENERALIZED_TIME = 0x18
export const ASN1_TAG_CONTEXT_0 = 0xa0
const ASN1_LONG_FORM_FLAG = 0x80
const ASN1_LONG_FORM_MASK = 0x7f

export type Asn1Element = {
	readonly tag: number
	readonly value: Uint8Array
	readonly totalSize: number
}

export function readLength(bytes: Uint8Array, offset: number): { length: number; bytesRead: number } {
	if (offset >= bytes.length) return { length: 0, bytesRead: 0 }
	const first = bytes[offset] ?? 0
	if (first < ASN1_LONG_FORM_FLAG) return { length: first, bytesRead: 1 }
	const count = first & ASN1_LONG_FORM_MASK
	let length = 0
	for (let i = 0; i < count; i++) {
		length = (length << 8) | (bytes[offset + 1 + i] ?? 0)
	}
	return { length, bytesRead: 1 + count }
}

export function readElement(bytes: Uint8Array, offset: number): Asn1Element | null {
	if (offset + 2 > bytes.length) return null
	const tag = bytes[offset] ?? 0
	const { length, bytesRead } = readLength(bytes, offset + 1)
	const headerSize = 1 + bytesRead
	const valueEnd = offset + headerSize + length
	if (valueEnd > bytes.length) return null
	return {
		tag,
		value: bytes.subarray(offset + headerSize, valueEnd),
		totalSize: headerSize + length,
	}
}

/**
 * Reads an ASN.1 element and returns its full DER encoding (tag + length + value).
 *
 * @internal
 */
export function readElementRaw(bytes: Uint8Array, offset: number): Uint8Array | null {
	const el = readElement(bytes, offset)
	if (!el) return null
	return bytes.subarray(offset, offset + el.totalSize)
}
