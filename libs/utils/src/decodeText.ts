import type { DecodeTextOptions } from './DecodeTextOptions.ts'
import { decodeUtf8Bytes } from './decodeUtf8Bytes.ts'
import { isArrayBufferLike } from './isArrayBufferLike.ts'
import { UTF_16_BE } from './UTF_16_BE.ts'
import { UTF_16_LE } from './UTF_16_LE.ts'
import { UTF_8 } from './UTF_8.ts'

/**
 * Converts an ArrayBuffer or ArrayBufferView to a string. The function works like
 * `TextDecoder.decode` and also supports environments without `TextDecoder`.
 *
 * If the data is always UTF-8, use {@link decodeUtf8}. Its bundle is smaller.
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
export function decodeText(
	data: ArrayBufferLike | ArrayBufferView,
	options: DecodeTextOptions = {},
): string {
	let view: DataView

	if (isArrayBufferLike(data)) {
		view = new DataView(data)
	} else {
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
		} else {
			encoding = UTF_8
		}
	}

	if (typeof TextDecoder !== 'undefined') {
		return new TextDecoder(encoding).decode(view)
	}

	const { buffer, byteLength } = view

	if (encoding === UTF_8) {
		return decodeUtf8Bytes(
			new Uint8Array(buffer, view.byteOffset + byteOffset, byteLength - byteOffset),
		)
	}

	const endian = encoding !== UTF_16_BE
	let str = ''

	while (byteOffset < byteLength) {
		str += String.fromCharCode(view.getUint16(byteOffset, endian))
		byteOffset += 2
	}

	return str
}
