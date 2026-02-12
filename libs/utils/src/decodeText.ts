import type { DecodeTextOptions } from './DecodeTextOptions.ts'
import { UTF_16 } from './UTF_16.ts'
import { UTF_16_BE } from './UTF_16_BE.ts'
import { UTF_16_LE } from './UTF_16_LE.ts'
import { UTF_8 } from './UTF_8.ts'

/**
 * Converts an ArrayBuffer or ArrayBufferView to a string. Similar to `TextDecoder.decode`
 * but with a fallback for environments that don't support `TextDecoder`.
 *
 * @param data - The data to decode.
 * @param options - The options for the decoding.
 * @returns The string representation of the ArrayBuffer.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/decodeText.test.ts#example}
 */
export function decodeText(data: ArrayBuffer | ArrayBufferView, options: DecodeTextOptions = {}): string {
	let view: DataView

	if (data instanceof ArrayBuffer) {
		view = new DataView(data)
	}
	else {
		view = new DataView(data.buffer, data.byteOffset, data.byteLength)
	}

	let byteOffset = 0
	let { encoding } = options

	// If no encoding is provided, try to detect it from the BOM
	if (!encoding) {
		const first = view.getUint8(0)
		const second = view.getUint8(1)

		// UTF-8 BOM
		if (first == 0xef && second == 0xbb && view.getUint8(2) == 0xbf) {
			encoding = UTF_8
			byteOffset = 3
		}
		// UTF-16 BE BOM
		else if (first == 0xfe && second == 0xff) {
			encoding = UTF_16_BE
			byteOffset = 2
		}
		// UTF-16 LE BOM
		else if (first == 0xff && second == 0xfe) {
			encoding = UTF_16_LE
			byteOffset = 2
		}
		else {
			encoding = UTF_8
		}
	}

	if (typeof TextDecoder !== 'undefined') {
		return new TextDecoder(encoding).decode(view)
	}

	const { byteLength } = view
	const endian = encoding !== UTF_16_BE
	let str = ''
	let char!: number

	while (byteOffset < byteLength) {
		switch (encoding) {
			case UTF_8:
				char = view.getUint8(byteOffset)

				// Single byte (ASCII)
				if (char < 128) {
					byteOffset++
				}
				// 2-byte sequence
				else if (char >= 194 && char <= 223) {
					if (byteOffset + 1 < byteLength) {
						const byte2 = view.getUint8(byteOffset + 1)
						if (byte2 >= 128 && byte2 <= 191) {
							char = ((char & 0x1F) << 6) | (byte2 & 0x3F)
							byteOffset += 2
						}
						else {
							// Invalid sequence, skip
							byteOffset++
						}
					}
					else {
						// Incomplete sequence, skip
						byteOffset++
					}
				}
				// 3-byte sequence
				else if (char >= 224 && char <= 239) {
					if (byteOffset + 2 <= byteLength - 1) {
						const byte2 = view.getUint8(byteOffset + 1)
						const byte3 = view.getUint8(byteOffset + 2)
						if (byte2 >= 128 && byte2 <= 191 && byte3 >= 128 && byte3 <= 191) {
							char = ((char & 0x0F) << 12) | ((byte2 & 0x3F) << 6) | (byte3 & 0x3F)
							byteOffset += 3
						}
						else {
							// Invalid sequence, skip
							byteOffset++
						}
					}
					else {
						// Incomplete sequence, skip
						byteOffset++
					}
				}
				// 4-byte sequence
				else if (char >= 240 && char <= 244) {
					if (byteOffset + 3 <= byteLength - 1) {
						const byte2 = view.getUint8(byteOffset + 1)
						const byte3 = view.getUint8(byteOffset + 2)
						const byte4 = view.getUint8(byteOffset + 3)
						if (byte2 >= 128 && byte2 <= 191 && byte3 >= 128 && byte3 <= 191 && byte4 >= 128 && byte4 <= 191) {
							char = ((char & 0x07) << 18) | ((byte2 & 0x3F) << 12) | ((byte3 & 0x3F) << 6) | (byte4 & 0x3F)
							byteOffset += 4
						}
						else {
							// Invalid sequence, skip
							byteOffset++
						}
					}
					else {
						// Incomplete sequence, skip
						byteOffset++
					}
				}
				// Invalid byte, skip
				else {
					byteOffset++
				}
				break

			case UTF_16_BE:
			case UTF_16:
			case UTF_16_LE:
				char = view.getUint16(byteOffset, endian)
				byteOffset += 2
				break
		}

		str += String.fromCodePoint(char)
	}

	return str
}
