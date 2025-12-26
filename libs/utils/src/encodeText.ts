
/**
 * Converts a string to a Uint8Array. Similar to `TextEncoder.encode`
 * but with a fallback for environments that don't support `TextEncoder`.
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
