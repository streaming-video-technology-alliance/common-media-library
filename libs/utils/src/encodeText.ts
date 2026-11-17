/**
 * Converts a string to UTF-8 bytes in a Uint8Array. The function calls
 * `TextEncoder.encode`. The environment must have `TextEncoder`.
 *
 * @param data - The string to encode.
 * @returns The Uint8Array representation of the string.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/encodeText.test.ts#example}
 */
export function encodeText(data: string): Uint8Array<ArrayBuffer> {
	return new TextEncoder().encode(data)
}
