
/**
 * Converts a string to a Uint8Array. The function works like
 * `TextEncoder.encode` and also supports environments without `TextEncoder`.
 *
 * @param data - The string to encode.
 * @returns The Uint8Array representation of the string.
 *
 * @public
 *
 * @example
 * {@includeCode ../test/encodeText.test.ts#example}
 */
export function encodeText(data: string): Uint8Array {
	return new TextEncoder().encode(data)
}
