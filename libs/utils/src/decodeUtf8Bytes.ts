/**
 * Converts UTF-8 bytes to a string without `TextDecoder`. The result keeps a
 * leading byte order mark.
 *
 * @param bytes - The bytes to decode.
 * @returns The decoded string.
 *
 * @internal
 */
export function decodeUtf8Bytes(bytes: Uint8Array): string {
	// WHATWG Encoding Standard, UTF-8 decoder
	const { length } = bytes
	let str = ''
	let codePoint = 0
	let needed = 0
	let lower = 0x80
	let upper = 0xbf

	for (let i = 0; i < length; i++) {
		const byte = bytes[i]

		if (needed !== 0) {
			if (byte < lower || byte > upper) {
				// Read the byte again as the start of a new sequence
				needed = 0
				str += '\ufffd'
				i--
			} else {
				codePoint = (codePoint << 6) | (byte & 0x3f)

				if (--needed === 0) {
					str += String.fromCodePoint(codePoint)
				}
			}
			lower = 0x80
			upper = 0xbf
		} else if (byte < 0x80) {
			str += String.fromCharCode(byte)
		} else if (byte < 0xc2 || byte > 0xf4) {
			str += '\ufffd'
		} else {
			needed = byte < 0xe0 ? 1 : byte < 0xf0 ? 2 : 3
			codePoint = byte & (0x3f >> needed)

			if (byte === 0xe0) {
				lower = 0xa0
			} else if (byte === 0xed) {
				upper = 0x9f
			} else if (byte === 0xf0) {
				lower = 0x90
			} else if (byte === 0xf4) {
				upper = 0x8f
			}
		}
	}

	if (needed !== 0) {
		str += '\ufffd'
	}

	return str
}
