import { decodeUtf8Bytes } from './decodeUtf8Bytes.ts'

/**
 * Converts UTF-8 bytes to a string. The function uses `TextDecoder` if the
 * environment has it. Otherwise, the function decodes the bytes itself.
 *
 * Each invalid byte sequence gives U+FFFD, like in `TextDecoder`. A leading
 * byte order mark is the one difference. `TextDecoder` removes the byte order
 * mark. Without `TextDecoder`, the result keeps it.
 *
 * If the data is always UTF-8, use this function instead of `decodeText`.
 * The bundle of this function is smaller.
 *
 * @param data - The bytes to decode.
 * @returns The decoded string.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/decodeUtf8.test.ts#example}
 */
export function decodeUtf8(data: DataView | Uint8Array): string {
	if (typeof TextDecoder !== 'undefined') {
		return new TextDecoder().decode(data)
	}

	return decodeUtf8Bytes(new Uint8Array(data.buffer, data.byteOffset, data.byteLength))
}
